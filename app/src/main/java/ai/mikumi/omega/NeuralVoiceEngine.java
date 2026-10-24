package ai.mikumi.omega;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Handler;
import android.os.Looper;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * GAPLESS PRE-BUFFERED HUMAN NEURAL VOICE STREAMER (ZERO CHOPPY PAUSES!)
 * 1. Tries local Termux Studio Server (http://127.0.0.1:8080/api/tts -> si-LK-ThiliniNeural MP3)
 * 2. Fallback: Pre-fetches ALL clause MP3 buffers into RAM BEFORE sequential playback
 *    so clauses flow back-to-back seamlessly with ZERO inter-word chopping!
 */
public class NeuralVoiceEngine {
    private static final ExecutorService pool = Executors.newSingleThreadExecutor();
    private static final Handler main = new Handler(Looper.getMainLooper());
    private static MediaPlayer currentPlayer = null;
    private static volatile int generationToken = 0;

    public static void stopAll() {
        generationToken++;
        main.post(() -> {
            if (currentPlayer != null) {
                try { currentPlayer.stop(); } catch (Exception ignored) {}
                try { currentPlayer.release(); } catch (Exception ignored) {}
                currentPlayer = null;
            }
        });
    }

    public static void speakNaturalHumanGirl(final Context ctx, final String rawText, final String langHint) {
        if (ctx == null || rawText == null || rawText.trim().isEmpty()) return;
        final int myToken = ++generationToken;

        final String cleaned = rawText
            .replaceAll("\\*+|_+|`+|#+", "")
            .replaceAll("[♡✦●→↗⚡]", " ")
            .replaceAll("\\s+", " ")
            .trim();
        if (cleaned.isEmpty()) return;

        pool.execute(() -> {
            try {
                // Tier 1: Local Termux Studio Server (Microsoft Azure si-LK-ThiliniNeural)
                String voiceName = "si".equalsIgnoreCase(langHint) ? "si-LK-ThiliniNeural" : "en-US-AnaNeural";
                String localUrl = "http://127.0.0.1:8080/api/tts?voice="
                    + URLEncoder.encode(voiceName, "UTF-8")
                    + "&text=" + URLEncoder.encode(cleaned, "UTF-8");
                byte[] studioMp3 = downloadBytes(localUrl, 1600);
                if (studioMp3 != null && studioMp3.length > 1000 && myToken == generationToken) {
                    List<File> single = new ArrayList<>();
                    File f = writeTempMp3(ctx, studioMp3, 0);
                    if (f != null) single.add(f);
                    playPrebufferedQueue(single, 0, myToken);
                    return;
                }

                // Tier 2: Pre-buffer all clause MP3 streams into cache files FIRST -> zero choppy gaps!
                List<String> clauses = splitNaturalClauses(cleaned, 175);
                List<File> readyFiles = new ArrayList<>();
                String tl = "si".equalsIgnoreCase(langHint) ? "si" : "en";

                for (int i = 0; i < clauses.size(); i++) {
                    if (myToken != generationToken) return;
                    String c = clauses.get(i);
                    String gUrl = "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl="
                        + tl + "&q=" + URLEncoder.encode(c, "UTF-8");
                    byte[] mp3 = downloadBytes(gUrl, 5000);
                    if (mp3 != null && mp3.length > 500) {
                        File f = writeTempMp3(ctx, mp3, i);
                        if (f != null) readyFiles.add(f);
                    }
                }
                if (!readyFiles.isEmpty() && myToken == generationToken) {
                    playPrebufferedQueue(readyFiles, 0, myToken);
                }
            } catch (Exception ignored) {}
        });
    }

    private static void playPrebufferedQueue(final List<File> files, final int index, final int token) {
        if (index >= files.size() || token != generationToken) return;
        main.post(() -> {
            if (token != generationToken) return;
            try {
                if (currentPlayer != null) {
                    try { currentPlayer.release(); } catch (Exception ignored) {}
                }
                MediaPlayer mp = new MediaPlayer();
                mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build());
                mp.setDataSource(files.get(index).getAbsolutePath());
                mp.setOnCompletionListener(p -> {
                    try { p.release(); } catch (Exception ignored) {}
                    if (currentPlayer == p) currentPlayer = null;
                    playPrebufferedQueue(files, index + 1, token);
                });
                mp.prepare();
                currentPlayer = mp;
                mp.start();
            } catch (Exception ignored) {}
        });
    }

    private static File writeTempMp3(Context ctx, byte[] data, int idx) {
        try {
            File out = new File(ctx.getCacheDir(), "mikumi_voice_" + idx + ".mp3");
            try (FileOutputStream fos = new FileOutputStream(out)) {
                fos.write(data);
            }
            return out;
        } catch (Exception e) {
            return null;
        }
    }

    private static byte[] downloadBytes(String urlStr, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            URL u = new URL(urlStr);
            conn = (HttpURLConnection) u.openConnection();
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs + 2500);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Android 15; Nothing Phone 3a)");
            if (conn.getResponseCode() != 200) return null;
            InputStream is = conn.getInputStream();
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int r;
            while ((r = is.read(buf)) != -1) bos.write(buf, 0, r);
            is.close();
            return bos.toByteArray();
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static List<String> splitNaturalClauses(String text, int maxLen) {
        List<String> out = new ArrayList<>();
        String[] parts = text.split("(?<=[.!?।])\\s+");
        StringBuilder cur = new StringBuilder();
        for (String p : parts) {
            if (cur.length() + p.length() + 1 <= maxLen) {
                if (cur.length() > 0) cur.append(" ");
                cur.append(p);
            } else {
                if (cur.length() > 0) out.add(cur.toString());
                cur = new StringBuilder(p.length() > maxLen ? p.substring(0, maxLen) : p);
            }
        }
        if (cur.length() > 0) out.add(cur.toString());
        return out;
    }
}
