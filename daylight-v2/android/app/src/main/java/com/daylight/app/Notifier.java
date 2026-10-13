package com.daylight.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

final class Notifier {
    static final String CH_ALARMS = "daylight_alarms";
    static final String CH_REMINDERS = "daylight_reminders";
    static final String CH_FOCUS = "daylight_focus";

    private Notifier() { }

    static void ensureChannels(Context ctx) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmSound == null) alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationChannel alarms = new NotificationChannel(CH_ALARMS, "Alarms", NotificationManager.IMPORTANCE_HIGH);
        alarms.setDescription("Daylight alarm clock");
        alarms.enableVibration(true);
        alarms.setVibrationPattern(new long[]{0, 600, 400, 600, 400, 600});
        alarms.setSound(alarmSound, new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
        alarms.setBypassDnd(true);

        NotificationChannel reminders = new NotificationChannel(CH_REMINDERS, "Reminders", NotificationManager.IMPORTANCE_HIGH);
        reminders.setDescription("Task and birthday reminders");
        reminders.enableVibration(true);

        NotificationChannel focus = new NotificationChannel(CH_FOCUS, "Focus timer", NotificationManager.IMPORTANCE_HIGH);
        focus.setDescription("Pomodoro session finished");
        focus.enableVibration(true);

        nm.createNotificationChannel(alarms);
        nm.createNotificationChannel(reminders);
        nm.createNotificationChannel(focus);
    }

    static boolean hasPermission(Context ctx) {
        if (Build.VERSION.SDK_INT >= 33) {
            return ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        return nm == null || nm.areNotificationsEnabled();
    }

    static void show(Context ctx, String id, String title, String body, String kind) {
        if (!hasPermission(ctx)) return;
        ensureChannels(ctx);
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;

        String channel = "alarm".equals(kind) ? CH_ALARMS : "focus".equals(kind) ? CH_FOCUS : CH_REMINDERS;

        Intent open = new Intent(ctx, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(ctx, id.hashCode(), open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        android.app.Notification.Builder b = new android.app.Notification.Builder(ctx, channel)
                .setSmallIcon(R.drawable.ic_stat_sun)
                .setColor(0xFFF59E0B)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new android.app.Notification.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setContentIntent(contentIntent);

        if ("alarm".equals(kind)) {
            b.setCategory(android.app.Notification.CATEGORY_ALARM);
            b.setFullScreenIntent(contentIntent, true);
        } else {
            b.setCategory(android.app.Notification.CATEGORY_REMINDER);
        }
        nm.notify(id.hashCode(), b.build());
    }
}
