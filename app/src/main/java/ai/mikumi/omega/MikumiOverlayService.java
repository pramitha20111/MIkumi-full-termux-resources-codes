package ai.mikumi.omega;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import org.json.JSONObject;

public class MikumiOverlayService extends Service {
    public static volatile boolean isRunning = false;
    private static final String CHANNEL_ID = "mikumi_hyper3d_channel_v4";

    private WindowManager wm;
    private LinearLayout companion3DFrame;
    private WebView overlay3DWebView;

    private LinearLayout edgeDock;
    private LinearLayout fullPillBar;
    private TextView stealthPeekTab;
    private LinearLayout miniChatDrawer;
    private TextView miniReplyView;
    private EditText miniInput;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Random rng = new Random();

    private String vrmModel = "mikumi_vita.vrm";
    private String shaderTheme = "nothing_white";
    private int scalePercent = 100;
    private String currentPet = "pet_droid";
    private String currentPetName = "Mochi";
    private boolean showPet = true;
    private boolean showEdgeBox = true;
    private boolean voiceEnabled = true;
    private boolean liveScreenWatch = true;
    private int targetFps = 30;
    private String currentGame = "Free Fire / PUBG";

    private static final String[] GAME_TIPS = {
        "Pro Tip: Right-hand peek ganna, 35% aduwen body expose wenne!",
        "Tactical: Zone edge rotate weddi smoke 1k fake side ekata danna!",
        "Smart Play: High ground hold karanna, 3rd party fight mada yanna epa!",
        "120Hz Focus: Crosshair head-level thiyagena smooth drag karanna!"
    };

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        isRunning = true;
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        startAndroid15CompliantForegroundNotification();

        if (Settings.canDrawOverlays(this)) {
            create3DOverlayWindows();
        }

        MikumiScreenHelperService.listener = (pkg, visibleText) ->
            mainHandler.post(() -> handleLiveScreenOrReelReaction(pkg, visibleText));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if ("STOP_ALL".equals(intent.getAction())) {
                stopSelf();
                return START_NOT_STICKY;
            }
            if (intent.hasExtra("vrmModel")) vrmModel = intent.getStringExtra("vrmModel");
            if (intent.hasExtra("theme")) shaderTheme = intent.getStringExtra("theme");
            if (intent.hasExtra("scale")) scalePercent = intent.getIntExtra("scale", 100);
            if (intent.hasExtra("pet")) currentPet = intent.getStringExtra("pet");
            if (intent.hasExtra("petName")) currentPetName = intent.getStringExtra("petName");
            if (intent.hasExtra("showPet")) showPet = intent.getBooleanExtra("showPet", true);
            if (intent.hasExtra("showEdge")) showEdgeBox = intent.getBooleanExtra("showEdge", true);
            if (intent.hasExtra("voiceOn")) voiceEnabled = intent.getBooleanExtra("voiceOn", true);
            if (intent.hasExtra("screenWatch")) {
                liveScreenWatch = intent.getBooleanExtra("screenWatch", true);
                MikumiScreenHelperService.liveAutoWatchEnabled = liveScreenWatch;
            }
            if (intent.hasExtra("fps")) targetFps = intent.getIntExtra("fps", 30);
            if (intent.hasExtra("game")) currentGame = intent.getStringExtra("game");
            sync3DOverlayState(null, null);
        }
        return START_NOT_STICKY;
    }

    private void handleLiveScreenOrReelReaction(String pkg, String text) {
        String low = (pkg + " " + text).toLowerCase(Locale.ROOT);
        String reactionSi;
        String anim = "wave";

        if (low.contains("food") || low.contains("recipe") || low.contains("kottu") || low.contains("pizza") || low.contains("cake") || low.contains("eat")) {
            reactionSi = "අම්මෝ... මේ රීල් එකේ තියෙන කෑම එක දැක්කම නම් මටත් බඩගිනි හැදුණා අනේ! 😋";
            anim = "headpat";
        } else if (low.contains("funny") || low.contains("lol") || low.contains("meme") || low.contains("comedy") || low.contains("prank") || low.contains("😂")) {
            reactionSi = "හහා! ඔයා බලන මේ රීල් එක නම් මාරම ෆනී අනේ! මටත් හිනා ගියා! 😆";
            anim = "dance";
        } else if (low.contains("pubg") || low.contains("free fire") || low.contains("clutch") || low.contains("headshot") || low.contains("gaming")) {
            reactionSi = "වාව්! ඒ ගේම් ප්ලේ ක්ලිප් එක නම් සුපිරිම ෂොට් එකක්! 🔥";
            anim = "gamer";
        } else if (low.contains("music") || low.contains("song") || low.contains("dance") || low.contains("cover")) {
            reactionSi = "මේ සින්දුවේ බීට් එක නම් හරිම ලස්සනයි... මාත් ඒකට 3D ඩාන්ස් කරනවා! 💃✨";
            anim = "dance";
        } else if (low.contains("instagram") || low.contains("musically") || low.contains("youtube")) {
            reactionSi = "ම්ම්... ඔයා බලන මේ වීඩියෝ එක හරිම interesting වගේ! මාත් ඔයා එක්කම බලන් ඉන්නේ ♡";
            anim = "peace";
        } else {
            reactionSi = "ඔයා දැන් screen එකේ බලන දේ මට තේරුණා — ඕනම උදව්වක් නම් කියන්න හොඳේ ✨";
            anim = "wave";
        }

        if (miniReplyView != null) {
            miniReplyView.setText((voiceEnabled ? "🔊 Spoken: " : "💬 Silent Text: ") + reactionSi);
        }
        sync3DOverlayState(anim, reactionSi);
        if (voiceEnabled) {
            NeuralVoiceEngine.speakNaturalHumanGirl(this, reactionSi, "si");
        }
    }

    private void startAndroid15CompliantForegroundNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID,
                "Mikumi Hyper-3D Companion",
                NotificationManager.IMPORTANCE_LOW
            );
            nm.createNotificationChannel(ch);
        }

        Intent stopIntent = new Intent(this, MikumiOverlayService.class);
        stopIntent.setAction("STOP_ALL");
        int pFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent stopPi = PendingIntent.getService(this, 11, stopIntent, pFlags);

        Intent openIntent = new Intent(this, MainActivity.class);
        PendingIntent openPi = PendingIntent.getActivity(this, 12, openIntent, pFlags);

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        Notification n = b
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Mikumi 3D Omega v5.0 • Active")
            .setContentText("Studio Mocap 3D Waifu + 3D Pet + Human Voice Live")
            .setContentIntent(openPi)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Turn OFF", stopPi)
            .setOngoing(true)
            .build();

        // Android 14 & 15 strict FGS type compliance!
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(4040, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(4040, n);
        }
    }

    private int overlayWindowType() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable nothingPillBg(int fillColor, int strokeColor, int radiusDp) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(fillColor);
        gd.setCornerRadius(dp(radiusDp));
        gd.setStroke(dp(1), strokeColor);
        return gd;
    }

    public static WebResourceResponse serveLocalAsset(android.content.Context ctx, Uri uri) {
        if (uri == null || !"mikumi.local".equalsIgnoreCase(uri.getHost())) return null;
        String path = uri.getPath();
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        try {
            InputStream is = ctx.getAssets().open("www" + path);
            String mime = "application/octet-stream";
            boolean isText = false;
            if (path.endsWith(".html")) { mime = "text/html"; isText = true; }
            else if (path.endsWith(".js")) { mime = "application/javascript"; isText = true; }
            else if (path.endsWith(".css")) { mime = "text/css"; isText = true; }
            else if (path.endsWith(".json")) { mime = "application/json"; isText = true; }
            else if (path.endsWith(".vrm") || path.endsWith(".vrma") || path.endsWith(".glb")) mime = "model/gltf-binary";
            else if (path.endsWith(".mp3")) mime = "audio/mpeg";
            else if (path.endsWith(".webp")) mime = "image/webp";
            else if (path.endsWith(".png")) mime = "image/png";

            WebResourceResponse resp = new WebResourceResponse(mime, isText ? "UTF-8" : null, is);
            Map<String, String> headers = new HashMap<>();
            headers.put("Access-Control-Allow-Origin", "*");
            resp.setResponseHeaders(headers);
            return resp;
        } catch (Exception e) {
            return null;
        }
    }

    private void create3DOverlayWindows() {
        if (companion3DFrame != null) return;

        companion3DFrame = new LinearLayout(this);
        companion3DFrame.setOrientation(LinearLayout.VERTICAL);
        companion3DFrame.setGravity(Gravity.CENTER_HORIZONTAL);
        companion3DFrame.setBackgroundColor(Color.TRANSPARENT);

        LinearLayout topHandleRow = new LinearLayout(this);
        topHandleRow.setOrientation(LinearLayout.HORIZONTAL);
        topHandleRow.setGravity(Gravity.CENTER_VERTICAL);
        topHandleRow.setBackground(nothingPillBg(Color.parseColor("#DDFFFFFF"), Color.parseColor("#33111215"), 10));
        topHandleRow.setPadding(dp(8), dp(2), dp(6), dp(2));

        TextView dragBar = new TextView(this);
        dragBar.setText("● MIKUMI 3D  ");
        dragBar.setTextSize(8.5f);
        dragBar.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        dragBar.setTextColor(Color.parseColor("#111215"));

        TextView hide3DBtn = new TextView(this);
        hide3DBtn.setText("—");
        hide3DBtn.setTextSize(10f);
        hide3DBtn.setPadding(dp(4), 0, dp(2), 0);
        hide3DBtn.setTextColor(Color.parseColor("#D71921"));

        topHandleRow.addView(dragBar);
        topHandleRow.addView(hide3DBtn);

        overlay3DWebView = new WebView(this);
        overlay3DWebView.setBackgroundColor(Color.TRANSPARENT);
        overlay3DWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings ws = overlay3DWebView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);

        overlay3DWebView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void speakText(String txt) {
                if (voiceEnabled && txt != null) {
                    NeuralVoiceEngine.speakNaturalHumanGirl(MikumiOverlayService.this, txt, "si");
                }
            }
        }, "OverlayNative");

        overlay3DWebView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                WebResourceResponse r = serveLocalAsset(MikumiOverlayService.this, req.getUrl());
                return r != null ? r : super.shouldInterceptRequest(view, req);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                sync3DOverlayState("mora_cyber", "Mikumi 3D + Pet Live! ♡");
            }
        });

        int wDp = (int) (205 * (scalePercent / 100.0f));
        int hDp = (int) (260 * (scalePercent / 100.0f));
        companion3DFrame.addView(topHandleRow);
        companion3DFrame.addView(overlay3DWebView, new LinearLayout.LayoutParams(dp(wDp), dp(hDp)));

        hide3DBtn.setOnClickListener(v -> {
            boolean vis = overlay3DWebView.getVisibility() == View.VISIBLE;
            overlay3DWebView.setVisibility(vis ? View.GONE : View.VISIBLE);
            hide3DBtn.setText(vis ? "+" : "—");
        });

        final WindowManager.LayoutParams compParams = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        compParams.gravity = Gravity.TOP | Gravity.START;
        compParams.x = dp(8);
        compParams.y = dp(170);

        attachDragGesture(dragBar, companion3DFrame, compParams);
        wm.addView(companion3DFrame, compParams);
        overlay3DWebView.loadUrl("https://mikumi.local/overlay3d.html");

        edgeDock = new LinearLayout(this);
        edgeDock.setOrientation(LinearLayout.VERTICAL);
        edgeDock.setGravity(Gravity.END);

        stealthPeekTab = new TextView(this);
        stealthPeekTab.setText("‹");
        stealthPeekTab.setTextColor(Color.parseColor("#D71921"));
        stealthPeekTab.setTypeface(Typeface.DEFAULT_BOLD);
        stealthPeekTab.setTextSize(14f);
        stealthPeekTab.setPadding(dp(5), dp(14), dp(4), dp(14));
        stealthPeekTab.setBackground(nothingPillBg(Color.parseColor("#CCFFFFFF"), Color.parseColor("#33D71921"), 12));
        stealthPeekTab.setVisibility(View.GONE);

        fullPillBar = new LinearLayout(this);
        fullPillBar.setOrientation(LinearLayout.VERTICAL);
        fullPillBar.setBackground(nothingPillBg(Color.parseColor("#F5FFFFFF"), Color.parseColor("#33111215"), 18));
        fullPillBar.setPadding(dp(6), dp(7), dp(6), dp(7));

        TextView btnMic = buildPillBtn("🎤");
        TextView btnChat = buildPillBtn("💬");
        TextView btnDance = buildPillBtn("⚡");
        TextView btnGame = buildPillBtn("🎮");
        TextView btnHideEdge = buildPillBtn("✕");

        fullPillBar.addView(btnMic);
        fullPillBar.addView(btnChat);
        fullPillBar.addView(btnDance);
        fullPillBar.addView(btnGame);
        fullPillBar.addView(btnHideEdge);

        miniChatDrawer = new LinearLayout(this);
        miniChatDrawer.setOrientation(LinearLayout.VERTICAL);
        miniChatDrawer.setBackground(nothingPillBg(Color.parseColor("#FAFFFFFF"), Color.parseColor("#33111215"), 16));
        miniChatDrawer.setPadding(dp(10), dp(10), dp(10), dp(10));
        miniChatDrawer.setVisibility(View.GONE);

        miniReplyView = new TextView(this);
        miniReplyView.setText("MIKUMI 3D v4.0 • Watching Reels & Commands ♡");
        miniReplyView.setTextColor(Color.parseColor("#111215"));
        miniReplyView.setTextSize(11f);
        miniReplyView.setMaxWidth(dp(225));
        miniReplyView.setPadding(0, 0, 0, dp(6));

        miniInput = new EditText(this);
        miniInput.setHint("Command / Chat...");
        miniInput.setTextSize(12f);
        miniInput.setTextColor(Color.parseColor("#111215"));
        miniInput.setSingleLine(true);

        TextView sendBtn = new TextView(this);
        sendBtn.setText("SEND ->");
        sendBtn.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        sendBtn.setTextColor(Color.WHITE);
        sendBtn.setGravity(Gravity.CENTER);
        sendBtn.setBackground(nothingPillBg(Color.parseColor("#111215"), Color.parseColor("#111215"), 10));
        sendBtn.setPadding(dp(10), dp(6), dp(10), dp(6));

        miniChatDrawer.addView(miniReplyView);
        miniChatDrawer.addView(miniInput, new LinearLayout.LayoutParams(dp(215), WindowManager.LayoutParams.WRAP_CONTENT));
        miniChatDrawer.addView(sendBtn);

        edgeDock.addView(stealthPeekTab);
        edgeDock.addView(fullPillBar);
        edgeDock.addView(miniChatDrawer);

        final WindowManager.LayoutParams edgeParams = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayWindowType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );
        edgeParams.gravity = Gravity.CENTER_VERTICAL | Gravity.END;
        edgeParams.x = dp(4);

        btnHideEdge.setOnClickListener(v -> {
            fullPillBar.setVisibility(View.GONE);
            miniChatDrawer.setVisibility(View.GONE);
            stealthPeekTab.setVisibility(View.VISIBLE);
            edgeParams.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
            wm.updateViewLayout(edgeDock, edgeParams);
        });

        stealthPeekTab.setOnClickListener(v -> {
            stealthPeekTab.setVisibility(View.GONE);
            fullPillBar.setVisibility(View.VISIBLE);
        });

        btnChat.setOnClickListener(v -> {
            boolean opening = miniChatDrawer.getVisibility() != View.VISIBLE;
            miniChatDrawer.setVisibility(opening ? View.VISIBLE : View.GONE);
            edgeParams.flags = opening
                ? WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                : WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
            wm.updateViewLayout(edgeDock, edgeParams);
        });

        btnMic.setOnClickListener(v -> {
            Intent openVoice = new Intent(this, MainActivity.class);
            openVoice.putExtra("quick_voice", true);
            openVoice.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(openVoice);
        });

        btnDance.setOnClickListener(v -> sync3DOverlayState("mora_cyber", "Hyper-Mora 3D Overload! ⚡✨"));

        btnGame.setOnClickListener(v -> {
            String tip = "[" + currentGame + "] " + GAME_TIPS[rng.nextInt(GAME_TIPS.length)];
            sync3DOverlayState("gamer", tip);
            if (voiceEnabled) NeuralVoiceEngine.speakNaturalHumanGirl(this, tip, "en");
        });

        sendBtn.setOnClickListener(v -> {
            String q = miniInput.getText().toString().trim();
            if (q.isEmpty()) return;
            miniInput.setText("");
            String reply = "හොඳයි! \"" + q + "\" — මම ඒක කරන්නම්! ♡";
            miniReplyView.setText(reply);
            sync3DOverlayState("wave", reply);
            if (voiceEnabled) NeuralVoiceEngine.speakNaturalHumanGirl(this, reply, "si");
        });

        wm.addView(edgeDock, edgeParams);
    }

    private TextView buildPillBtn(String icon) {
        TextView tv = new TextView(this);
        tv.setText(icon);
        tv.setTextSize(14f);
        tv.setGravity(Gravity.CENTER);
        tv.setPadding(dp(6), dp(5), dp(6), dp(5));
        return tv;
    }

    private void sync3DOverlayState(String triggerAction, String speechText) {
        if (overlay3DWebView != null) {
            int wDp = (int) (205 * (scalePercent / 100.0f));
            int hDp = (int) (260 * (scalePercent / 100.0f));
            overlay3DWebView.setLayoutParams(new LinearLayout.LayoutParams(dp(wDp), dp(hDp)));

            try {
                JSONObject cfg = new JSONObject();
                cfg.put("vrmModel", vrmModel);
                cfg.put("theme", shaderTheme);
                cfg.put("pet", currentPet);
                cfg.put("petName", currentPetName);
                cfg.put("showPet", showPet);
                cfg.put("fps", targetFps);
                if (triggerAction != null) cfg.put("action", triggerAction);
                if (speechText != null) cfg.put("say", speechText);
                final String js = "window.applyOverlayUpdate && window.applyOverlayUpdate(" + cfg.toString() + ");";
                overlay3DWebView.post(() -> overlay3DWebView.evaluateJavascript(js, null));
            } catch (Exception ignored) {}
        }
        if (edgeDock != null) {
            edgeDock.setVisibility(showEdgeBox ? View.VISIBLE : View.GONE);
        }
    }

    private void attachDragGesture(View handle, final View targetRoot, final WindowManager.LayoutParams params) {
        handle.setOnTouchListener(new View.OnTouchListener() {
            private int initX, initY;
            private float touchX, touchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        initX = params.x;
                        initY = params.y;
                        touchX = event.getRawX();
                        touchY = event.getRawY();
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        params.x = initX + Math.round(event.getRawX() - touchX);
                        params.y = initY + Math.round(event.getRawY() - touchY);
                        if (wm != null) wm.updateViewLayout(targetRoot, params);
                        return true;
                }
                return false;
            }
        });
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        MikumiScreenHelperService.listener = null;
        NeuralVoiceEngine.stopAll();
        if (overlay3DWebView != null) {
            overlay3DWebView.loadUrl("about:blank");
            overlay3DWebView.destroy();
        }
        if (wm != null) {
            if (companion3DFrame != null) try { wm.removeView(companion3DFrame); } catch (Exception ignored) {}
            if (edgeDock != null) try { wm.removeView(edgeDock); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
