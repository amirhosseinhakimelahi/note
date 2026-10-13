package com.daylight.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** Stores the schedule handed over from the web app and registers it with AlarmManager. */
final class Scheduler {
    private static final String PREFS = "daylight_schedule";
    private Scheduler() { }

    static synchronized void sync(Context ctx, String group, String json) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        // cancel everything previously scheduled for this group
        cancelAll(ctx, prefs.getString(group, "[]"));
        prefs.edit().putString(group, json == null ? "[]" : json).apply();
        scheduleAll(ctx, json);
    }

    /** Re-register every stored item (after reboot / app update). */
    static synchronized void restore(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        for (Object v : prefs.getAll().values()) {
            if (v instanceof String) scheduleAll(ctx, (String) v);
        }
    }

    private static void scheduleAll(Context ctx, String json) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null || json == null) return;
        long now = System.currentTimeMillis();
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                long at = o.getLong("at");
                if (at <= now) continue;
                String id = o.getString("id");
                String kind = o.optString("kind", "reminder");
                PendingIntent pi = pending(ctx, id, o.optString("title"), o.optString("body"), kind);

                boolean canExact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
                if (canExact && "alarm".equals(kind)) {
                    PendingIntent show = PendingIntent.getActivity(ctx, id.hashCode(),
                            new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                    am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), pi);
                } else if (canExact) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                }
            }
        } catch (Exception ignored) { }
    }

    private static void cancelAll(Context ctx, String json) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null || json == null) return;
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                am.cancel(pending(ctx, o.getString("id"), "", "", o.optString("kind", "reminder")));
            }
        } catch (Exception ignored) { }
    }

    private static PendingIntent pending(Context ctx, String id, String title, String body, String kind) {
        Intent i = new Intent(ctx, AlarmReceiver.class)
                .setAction("com.daylight.app.FIRE." + id)
                .putExtra("id", id)
                .putExtra("title", title)
                .putExtra("body", body)
                .putExtra("kind", kind);
        return PendingIntent.getBroadcast(ctx, id.hashCode(), i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
