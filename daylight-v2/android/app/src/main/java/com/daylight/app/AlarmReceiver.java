package com.daylight.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String id = intent.getStringExtra("id");
        String kind = intent.getStringExtra("kind");
        if (id == null) return;
        // When the app is open, the in-app alarm screen already rings
        if (MainActivity.inForeground && "alarm".equals(kind)) return;
        Notifier.show(ctx, id, intent.getStringExtra("title"), intent.getStringExtra("body"), kind);
    }
}
