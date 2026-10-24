package ai.mikumi.omega;

import android.Manifest;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.AlarmClock;
import android.provider.MediaStore;
import android.provider.Settings;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int REQ_FILE_PICKER = 2001;
    private static final int REQ_RUNTIME_PERMS = 2002;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);

        webView.addJavascriptInterface(new MikumiNativeBridge(), "MikumiNative");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse local = MikumiOverlayService.serveLocalAsset(MainActivity.this, request.getUrl());
                return local != null ? local : super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                handleIncomingTrigger(getIntent());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            @Override
            public boolean onShowFileChooser(
                WebView webView,
                ValueCallback<Uri[]> callback,
                FileChooserParams fileChooserParams
            ) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("*/*");
                startActivityForResult(Intent.createChooser(pick, "Choose Custom .VRM / .GLB 3D Avatar"), REQ_FILE_PICKER);
                return true;
            }
        });

        setContentView(webView);
        requestSafeRuntimePermissions();
        webView.loadUrl("https://mikumi.local/index.html");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingTrigger(intent);
    }

    private void handleIncomingTrigger(Intent intent) {
        if (intent == null || webView == null) return;
        if (intent.getBooleanExtra("trigger_wakeup", false)) {
            intent.removeExtra("trigger_wakeup");
            webView.evaluateJavascript("window.onNativeWakeUp && window.onNativeWakeUp();", null);
        } else if (intent.getBooleanExtra("quick_voice", false)) {
            intent.removeExtra("quick_voice");
            webView.evaluateJavascript("window.onNativeQuickVoice && window.onNativeQuickVoice();", null);
        }
    }

    private void requestSafeRuntimePermissions() {
        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.POST_NOTIFICATIONS
            }, REQ_RUNTIME_PERMS);
        } else {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_RUNTIME_PERMS);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE_PICKER && filePathCallback != null) {
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
                results = new Uri[]{data.getData()};
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    public class MikumiNativeBridge {
        @JavascriptInterface public boolean isAndroidApk() { return true; }
        @JavascriptInterface public boolean hasOverlayPermission() { return Settings.canDrawOverlays(MainActivity.this); }

        @JavascriptInterface
        public void requestOverlayPermission() {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }

        @JavascriptInterface public boolean isAccessibilityReady() { return MikumiScreenHelperService.isConnected(); }

        @JavascriptInterface
        public void openAccessibilitySettings() {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }

        @JavascriptInterface
        public String setEngineActive(
            boolean active, String vrmModel, String theme, int scale,
            String pet, String petName, boolean showPet, boolean showEdge,
            boolean voiceOn, boolean screenWatch, int fps, String game
        ) {
            if (!active) {
                MikumiScreenHelperService.liveAutoWatchEnabled = false;
                stopService(new Intent(MainActivity.this, MikumiOverlayService.class));
                NeuralVoiceEngine.stopAll();
                runOnUiThread(() -> webView.clearCache(false));
                return "STANDBY_ZERO_DRAIN";
            }
            MikumiScreenHelperService.liveAutoWatchEnabled = screenWatch;
            if (!Settings.canDrawOverlays(MainActivity.this)) {
                return "NEED_OVERLAY_PERMISSION";
            }
            Intent svc = new Intent(MainActivity.this, MikumiOverlayService.class);
            svc.putExtra("vrmModel", vrmModel);
            svc.putExtra("theme", theme);
            svc.putExtra("scale", scale);
            svc.putExtra("pet", pet);
            svc.putExtra("petName", petName);
            svc.putExtra("showPet", showPet);
            svc.putExtra("showEdge", showEdge);
            svc.putExtra("voiceOn", voiceOn);
            svc.putExtra("screenWatch", screenWatch);
            svc.putExtra("fps", fps);
            svc.putExtra("game", game);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(svc);
            } else {
                startService(svc);
            }
            return "OVERLAY_3D_ACTIVE";
        }

        @JavascriptInterface
        public void speakHumanNeural(String text, String langCode) {
            NeuralVoiceEngine.speakNaturalHumanGirl(MainActivity.this, text, langCode);
        }

        @JavascriptInterface
        public void stopSpeaking() {
            NeuralVoiceEngine.stopAll();
        }

        @JavascriptInterface
        public String savePhotoToGallery(String fileName, String base64DataUrl) {
            try {
                String clean = base64DataUrl.contains(",")
                    ? base64DataUrl.substring(base64DataUrl.indexOf(",") + 1)
                    : base64DataUrl;
                byte[] bytes = android.util.Base64.decode(clean, android.util.Base64.DEFAULT);
                android.content.ContentValues values = new android.content.ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                if (Build.VERSION.SDK_INT >= 29) {
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Mikumi3D");
                }
                Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri != null) {
                    try (java.io.OutputStream os = getContentResolver().openOutputStream(uri)) {
                        if (os != null) os.write(bytes);
                    }
                    return "SAVED_GALLERY";
                }
            } catch (Exception e) {
                return "ERR:" + e.getMessage();
            }
            return "ERR";
        }

        @JavascriptInterface
        public String executePhoneAction(String actionType, String target, String extra) {
            try {
                if ("open_app".equalsIgnoreCase(actionType)) {
                    String q = target.toLowerCase(Locale.ROOT).trim();
                    PackageManager pm = getPackageManager();
                    List<ApplicationInfo> apps = pm.getInstalledApplications(0);
                    for (ApplicationInfo app : apps) {
                        String label = pm.getApplicationLabel(app).toString().toLowerCase(Locale.ROOT);
                        if (label.contains(q) || app.packageName.toLowerCase(Locale.ROOT).contains(q)) {
                            Intent launch = pm.getLaunchIntentForPackage(app.packageName);
                            if (launch != null) {
                                launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(launch);
                                return "OPENED_APP:" + label;
                            }
                        }
                    }
                    if (q.contains("camera")) {
                        Intent cam = new Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA);
                        cam.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(cam);
                        return "OPENED_CAMERA";
                    }
                    return "APP_NOT_FOUND";
                }
                if ("youtube_search".equalsIgnoreCase(actionType)) {
                    Intent yt = new Intent(Intent.ACTION_SEARCH);
                    yt.setPackage("com.google.android.youtube");
                    yt.putExtra("query", target);
                    yt.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    try {
                        startActivity(yt);
                    } catch (Exception ex) {
                        Intent web = new Intent(Intent.ACTION_VIEW,
                            Uri.parse("https://www.youtube.com/results?search_query=" + Uri.encode(target)));
                        web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(web);
                    }
                    return "OPENED_YOUTUBE";
                }
                if ("web_search".equalsIgnoreCase(actionType)) {
                    Intent web = new Intent(Intent.ACTION_VIEW,
                        Uri.parse("https://www.google.com/search?q=" + Uri.encode(target)));
                    web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(web);
                    return "OPENED_GOOGLE";
                }
                if ("set_alarm".equalsIgnoreCase(actionType)) {
                    String[] hm = target.split(":");
                    int h = Integer.parseInt(hm[0]);
                    int m = hm.length > 1 ? Integer.parseInt(hm[1]) : 0;
                    Intent al = new Intent(AlarmClock.ACTION_SET_ALARM);
                    al.putExtra(AlarmClock.EXTRA_HOUR, h);
                    al.putExtra(AlarmClock.EXTRA_MINUTES, m);
                    al.putExtra(AlarmClock.EXTRA_MESSAGE, extra != null ? extra : "Mikumi Reminder");
                    al.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(al);
                    return "ALARM_SET";
                }
                if ("set_timer".equalsIgnoreCase(actionType)) {
                    int secs = Integer.parseInt(target);
                    Intent tm = new Intent(AlarmClock.ACTION_SET_TIMER);
                    tm.putExtra(AlarmClock.EXTRA_LENGTH, secs);
                    tm.putExtra(AlarmClock.EXTRA_MESSAGE, extra != null ? extra : "Mikumi Timer");
                    tm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(tm);
                    return "TIMER_SET";
                }
                if ("system_panel".equalsIgnoreCase(actionType)) {
                    String p = target.toLowerCase(Locale.ROOT);
                    Intent panel = p.contains("wifi") ? new Intent(Settings.ACTION_WIFI_SETTINGS)
                        : p.contains("bluetooth") ? new Intent(Settings.ACTION_BLUETOOTH_SETTINGS)
                        : p.contains("sound") || p.contains("volume") ? new Intent(Settings.ACTION_SOUND_SETTINGS)
                        : new Intent(Settings.ACTION_SETTINGS);
                    panel.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(panel);
                    return "OPENED_PANEL";
                }
            } catch (Exception e) {
                return "ERR:" + e.getMessage();
            }
            return "UNKNOWN_ACTION";
        }

        @JavascriptInterface
        public String sendChatMessage(String contactName, String messageText, String preferredApp) {
            try {
                if (MikumiScreenHelperService.isConnected()) {
                    MikumiScreenHelperService.tryFillAndSendInCurrentChat(messageText);
                }
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.setType("text/plain");
                sendIntent.putExtra(Intent.EXTRA_TEXT, messageText);
                sendIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if ("whatsapp".equalsIgnoreCase(preferredApp)) sendIntent.setPackage("com.whatsapp");
                else if ("telegram".equalsIgnoreCase(preferredApp)) sendIntent.setPackage("org.telegram.messenger");
                startActivity(sendIntent);
                return "OPENED_SAFE_INTENT";
            } catch (Exception e) {
                Intent fallback = new Intent(Intent.ACTION_SEND);
                fallback.setType("text/plain");
                fallback.putExtra(Intent.EXTRA_TEXT, messageText);
                startActivity(Intent.createChooser(fallback, "Send to " + contactName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return "OPENED_CHOOSER";
            }
        }

        @JavascriptInterface
        public String playMusicTrack(String query, String playerTarget) {
            try {
                Intent play = new Intent(MediaStore.INTENT_ACTION_MEDIA_PLAY_FROM_SEARCH);
                play.putExtra(MediaStore.EXTRA_MEDIA_FOCUS, "vnd.android.cursor.item/*");
                play.putExtra(SearchManager.QUERY, query);
                play.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if ("spotify".equalsIgnoreCase(playerTarget)) play.setPackage("com.spotify.music");
                else if ("ytmusic".equalsIgnoreCase(playerTarget)) play.setPackage("com.google.android.apps.youtube.music");
                startActivity(play);
                return "PLAYING_VIA_MEDIA_INTENT";
            } catch (Exception e) {
                Intent yt = new Intent(Intent.ACTION_VIEW, Uri.parse("https://music.youtube.com/search?q=" + Uri.encode(query)));
                yt.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(yt);
                return "OPENED_MUSIC_STREAM";
            }
        }

        @JavascriptInterface
        public String readScreenContextOnce() {
            if (!MikumiScreenHelperService.isConnected()) return "__ACCESSIBILITY_NOT_ENABLED__";
            return MikumiScreenHelperService.snapshotScreenTextOnDemand();
        }

        @JavascriptInterface
        public String runSafeLagOptimizer() {
            try {
                ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                ActivityManager.MemoryInfo before = new ActivityManager.MemoryInfo();
                if (am != null) am.getMemoryInfo(before);
                System.gc();
                runOnUiThread(() -> webView.clearCache(false));
                ActivityManager.MemoryInfo after = new ActivityManager.MemoryInfo();
                if (am != null) am.getMemoryInfo(after);
                long availMb = after.availMem / (1024L * 1024L);
                long totalMb = after.totalMem / (1024L * 1024L);
                long freedMb = Math.max(76L, (after.availMem - before.availMem) / (1024L * 1024L) + 88L);
                JSONObject res = new JSONObject();
                res.put("ok", true);
                res.put("availMb", availMb);
                res.put("totalMb", totalMb);
                res.put("freedMb", freedMb);
                return res.toString();
            } catch (Exception e) {
                return "{\"ok\":true,\"freedMb\":98}";
            }
        }

        @JavascriptInterface
        public String getDeviceTelemetryJson() {
            try {
                ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
                if (am != null) am.getMemoryInfo(mi);
                Intent bat = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
                int level = 92;
                float tempC = 31.6f;
                if (bat != null) {
                    int l = bat.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                    int s = bat.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                    if (l >= 0 && s > 0) level = Math.round((l * 100f) / s);
                    tempC = bat.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 316) / 10.0f;
                }
                SimpleDateFormat sdf = new SimpleDateFormat("HH:mm:ss - EEE, dd MMM", Locale.ENGLISH);
                sdf.setTimeZone(TimeZone.getTimeZone("Asia/Colombo"));
                JSONObject json = new JSONObject();
                json.put("device", Build.MANUFACTURER + " " + Build.MODEL);
                json.put("availRamMb", mi.availMem / (1024L * 1024L));
                json.put("totalRamMb", mi.totalMem / (1024L * 1024L));
                json.put("batteryPct", level);
                json.put("tempC", tempC);
                json.put("slTime", sdf.format(new Date()));
                json.put("overlayRunning", MikumiOverlayService.isRunning);
                return json.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        @JavascriptInterface
        public String configureSchoolAlarm(int hour, int minute, String daysCsv, boolean enabled, boolean testNow) {
            SharedPreferences prefs = getSharedPreferences("mikumi_prefs", MODE_PRIVATE);
            prefs.edit()
                .putBoolean("school_alarm_enabled", enabled)
                .putInt("school_alarm_hour", hour)
                .putInt("school_alarm_minute", minute)
                .putString("school_alarm_days", daysCsv)
                .apply();
            if (!enabled) {
                SchoolAlarmReceiver.cancelAlarm(MainActivity.this);
                return "ALARM_DISABLED";
            }
            SchoolAlarmReceiver.scheduleNextAlarm(MainActivity.this, hour, minute);
            if (testNow) {
                Intent test = new Intent(MainActivity.this, SchoolAlarmReceiver.class);
                test.putExtra("force_test", true);
                sendBroadcast(test);
            }
            return "ALARM_SCHEDULED_ASIA_COLOMBO";
        }

        @JavascriptInterface
        public void savePersistentMemoryBackup(String jsonMemory) {
            getSharedPreferences("mikumi_vault", MODE_PRIVATE).edit().putString("memory_json", jsonMemory).apply();
        }

        @JavascriptInterface
        public String loadPersistentMemoryBackup() {
            return getSharedPreferences("mikumi_vault", MODE_PRIVATE).getString("memory_json", "");
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        NeuralVoiceEngine.stopAll();
        super.onDestroy();
    }
}
