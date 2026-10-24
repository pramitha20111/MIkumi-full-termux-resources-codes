package ai.mikumi.omega;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import java.util.Calendar;
import java.util.TimeZone;

public class SchoolAlarmReceiver extends BroadcastReceiver {
    private static final String WAKE_CHANNEL = "mikumi_school_wakeup_v4";

    @Override
    public void onReceive(Context context, Intent intent) {
        SharedPreferences prefs = context.getSharedPreferences("mikumi_prefs", Context.MODE_PRIVATE);
        boolean forceTest = intent != null && intent.getBooleanExtra("force_test", false);
        boolean enabled = prefs.getBoolean("school_alarm_enabled", true);

        if (!forceTest && !enabled) return;

        Calendar colomboNow = Calendar.getInstance(TimeZone.getTimeZone("Asia/Colombo"));
        int todayDow = colomboNow.get(Calendar.DAY_OF_WEEK);
        String allowedDays = prefs.getString("school_alarm_days", "2,3,4,5,6");

        if (forceTest || allowedDays.contains(String.valueOf(todayDow))) {
            triggerSweetSchoolWakeUp(context);
        }

        if (!forceTest && enabled) {
            int hour = prefs.getInt("school_alarm_hour", 5);
            int minute = prefs.getInt("school_alarm_minute", 30);
            scheduleNextAlarm(context, hour, minute);
        }
    }

    private void triggerSweetSchoolWakeUp(final Context context) {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            Ringtone r = RingtoneManager.getRingtone(context, alarmUri);
            if (r != null) r.play();
        } catch (Exception ignored) {}

        NeuralVoiceEngine.speakNaturalHumanGirl(
            context,
            "සුභ උදෑසනක්! නැගිටින්න වෙලාව හරි! අද ඉස්කෝලේ යන්න ලෑස්ති වෙන්නකෝ!",
            "si"
        );

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                WAKE_CHANNEL,
                "Mikumi Sri Lanka School Wake-Up",
                NotificationManager.IMPORTANCE_HIGH
            );
            nm.createNotificationChannel(ch);
        }

        Intent launch = new Intent(context, MainActivity.class);
        launch.putExtra("trigger_wakeup", true);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int pFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent fullScreenPi = PendingIntent.getActivity(context, 707, launch, pFlags);

        Notification.Builder nb = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(context, WAKE_CHANNEL)
            : new Notification.Builder(context);

        Notification notif = nb
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("☀️ Suba Udasanak! School Wake-Up • Mikumi 3D")
            .setContentText("Sri Lanka Time (Asia/Colombo) — Time to get ready for school! ♡")
            .setContentIntent(fullScreenPi)
            .setFullScreenIntent(fullScreenPi, true)
            .setAutoCancel(true)
            .build();

        if (nm != null) nm.notify(7070, notif);
    }

    public static void scheduleNextAlarm(Context context, int hour24, int minute) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        TimeZone slTz = TimeZone.getTimeZone("Asia/Colombo");
        Calendar target = Calendar.getInstance(slTz);
        target.set(Calendar.HOUR_OF_DAY, hour24);
        target.set(Calendar.MINUTE, minute);
        target.set(Calendar.SECOND, 0);
        target.set(Calendar.MILLISECOND, 0);

        if (target.getTimeInMillis() <= System.currentTimeMillis()) {
            target.add(Calendar.DAY_OF_YEAR, 1);
        }

        Intent intent = new Intent(context, SchoolAlarmReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(context, 5050, intent, flags);

        try {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, target.getTimeInMillis(), pi);
        } catch (SecurityException se) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, target.getTimeInMillis(), pi);
        }
    }

    public static void cancelAlarm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent intent = new Intent(context, SchoolAlarmReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getBroadcast(context, 5050, intent, flags);
        am.cancel(pi);
    }
}
