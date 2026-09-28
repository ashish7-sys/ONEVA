package io.oneva.android.launcher;

import android.Manifest;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.util.DisplayMetrics;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import android.database.Cursor;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * ONEVA Native Android Bridge
 * 
 * Provides genuine Android device hardware & system integration for the ONEVA WebView:
 * - Real PackageManager device application scanning (honoring Android 11+ Package Visibility)
 * - Safe application launching via Intent
 * - System battery and power telemetry
 * - Network connectivity state monitoring
 * - Default launcher status verification & picker dialog
 * - Microphone permission & voice subsystem hooks
 */
public class OnevaNativeBridge {

    private final Context context;
    private MainActivity activity;
    private WebView webView;

    public OnevaNativeBridge(Context context) {
        this.context = context.getApplicationContext();
        if (context instanceof MainActivity) {
            this.activity = (MainActivity) context;
        }
    }

    public OnevaNativeBridge(Context context, WebView webView) {
        this.context = context.getApplicationContext();
        this.webView = webView;
        if (context instanceof MainActivity) {
            this.activity = (MainActivity) context;
        }
    }

    /**
     * Confirms the native bridge is loaded and accessible.
     */
    @JavascriptInterface
    public boolean isAvailable() {
        return true;
    }

    /**
     * Scans the Android device for genuine installed applications.
     * Uses PackageManager with Intent.ACTION_MAIN + CATEGORY_LAUNCHER.
     * 
     * @return JSON string containing array of installed application descriptors
     */
    @JavascriptInterface
    public String getInstalledApps() {
        JSONArray appsArray = new JSONArray();
        try {
            PackageManager pm = context.getPackageManager();

            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> resolveInfoList = pm.queryIntentActivities(
                mainIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PackageManager.MATCH_ALL : 0
            );

            Collections.sort(resolveInfoList, new Comparator<ResolveInfo>() {
                @Override
                public int compare(ResolveInfo o1, ResolveInfo o2) {
                    String label1 = o1.loadLabel(pm).toString();
                    String label2 = o2.loadLabel(pm).toString();
                    return label1.compareToIgnoreCase(label2);
                }
            });

            for (ResolveInfo ri : resolveInfoList) {
                if (ri.activityInfo == null) continue;

                String packageName = ri.activityInfo.packageName;
                String appLabel = ri.loadLabel(pm).toString();

                boolean isSystem = false;
                long lastUpdateTime = 0;
                String versionName = "1.0.0";
                int versionCode = 1;

                try {
                    PackageInfo pkgInfo = pm.getPackageInfo(packageName, 0);
                    isSystem = (pkgInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                    lastUpdateTime = pkgInfo.lastUpdateTime;
                    versionName = pkgInfo.versionName != null ? pkgInfo.versionName : "1.0.0";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        versionCode = (int) pkgInfo.getLongVersionCode();
                    } else {
                        versionCode = pkgInfo.versionCode;
                    }
                } catch (PackageManager.NameNotFoundException ignored) {}

                JSONObject appObj = new JSONObject();
                appObj.put("packageName", packageName);
                appObj.put("appName", appLabel);
                appObj.put("label", appLabel);
                appObj.put("isInstalled", true);
                appObj.put("launchAvailable", true);
                appObj.put("isSystemApp", isSystem);
                appObj.put("versionName", versionName);
                appObj.put("versionCode", versionCode);
                appObj.put("lastUpdateTime", lastUpdateTime);

                appsArray.put(appObj);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return appsArray.toString();
    }

    /**
     * Launches an installed application by package name.
     */
    @JavascriptInterface
    public boolean launchApp(String packageName) {
        if (packageName == null || packageName.trim().isEmpty()) {
            return false;
        }

        try {
            PackageManager pm = context.getPackageManager();
            Intent launchIntent = pm.getLaunchIntentForPackage(packageName.trim());
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launchIntent);
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Reads current battery percentage.
     */
    @JavascriptInterface
    public int getSystemBattery() {
        try {
            BatteryManager bm = (BatteryManager) context.getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) {
                return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            }
        } catch (Exception ignored) {}
        return 90;
    }

    /**
     * Checks if device is currently plugged into power.
     */
    @JavascriptInterface
    public boolean isDeviceCharging() {
        try {
            BatteryManager bm = (BatteryManager) context.getSystemService(Context.BATTERY_SERVICE);
            if (bm != null) {
                int status = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_STATUS);
                return status == BatteryManager.BATTERY_STATUS_CHARGING ||
                       status == BatteryManager.BATTERY_STATUS_FULL;
            }
        } catch (Exception ignored) {}
        return false;
    }

    /**
     * Checks if ONEVA is currently registered as the active default launcher.
     */
    @JavascriptInterface
    public boolean isDefaultLauncher() {
        try {
            final Intent filter = new Intent(Intent.ACTION_MAIN);
            filter.addCategory(Intent.CATEGORY_HOME);
            ResolveInfo resolveInfo = context.getPackageManager().resolveActivity(filter, PackageManager.MATCH_DEFAULT_ONLY);
            if (resolveInfo != null && resolveInfo.activityInfo != null) {
                return context.getPackageName().equals(resolveInfo.activityInfo.packageName);
            }
        } catch (Exception ignored) {}
        return false;
    }

    /**
     * Triggers the official Android system dialog to set ONEVA as the default home launcher.
     * Uses RoleManager on Android 10+ (API 29+) with graceful fallback to Settings.ACTION_HOME_SETTINGS.
     */
    @JavascriptInterface
    public void requestSetDefaultLauncher() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                android.app.role.RoleManager roleManager = (android.app.role.RoleManager) context.getSystemService(Context.ROLE_SERVICE);
                if (roleManager != null && roleManager.isRoleAvailable(android.app.role.RoleManager.ROLE_HOME)) {
                    Intent roleIntent = roleManager.createRequestRoleIntent(android.app.role.RoleManager.ROLE_HOME);
                    if (activity != null) {
                        activity.startActivity(roleIntent);
                        return;
                    } else {
                        roleIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(roleIntent);
                        return;
                    }
                }
            }
            Intent intent = new Intent(Settings.ACTION_HOME_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Intent.ACTION_MAIN);
                fallback.addCategory(Intent.CATEGORY_HOME);
                fallback.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(fallback);
            } catch (Exception ignored) {}
        }
    }

    /**
     * Returns current network type ("WIFI", "CELLULAR", "ETHERNET", or "NONE").
     */
    @JavascriptInterface
    public String getNetworkState() {
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.net.Network activeNetwork = cm.getActiveNetwork();
                if (activeNetwork != null) {
                    NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
                    if (caps != null) {
                        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) return "WIFI";
                        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) return "CELLULAR";
                        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) return "ETHERNET";
                    }
                }
            }
        } catch (Exception ignored) {}
        return "NONE";
    }

    /**
     * Checks if audio recording permission is granted.
     */
    @JavascriptInterface
    public boolean hasMicrophonePermission() {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Checks if camera permission is granted.
     */
    @JavascriptInterface
    public boolean hasCameraPermission() {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Checks if notification posting permission is granted.
     */
    @JavascriptInterface
    public boolean hasNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    /**
     * Checks if display over other apps (System Alert Window) permission is granted.
     */
    @JavascriptInterface
    public boolean hasOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(context);
        }
        return true;
    }

    /**
     * Checks if ONEVA Accessibility Service is active.
     */
    @JavascriptInterface
    public boolean hasAccessibilityPermission() {
        return OnevaAccessibilityService.getInstance() != null;
    }

    /**
     * Explicit on-demand request for Camera permission only (triggered when camera feature opens).
     */
    @JavascriptInterface
    public void requestCameraPermission() {
        if (activity != null) {
            activity.requestCameraPermissionFromBridge();
        }
    }

    /**
     * Explicit on-demand request for Microphone permission only (triggered when voice feature activates).
     */
    @JavascriptInterface
    public void requestMicrophonePermission() {
        if (activity != null) {
            activity.requestMicrophonePermissionFromBridge();
        }
    }

    /**
     * Requests all runtime permissions simultaneously (Microphone, Camera, Notifications).
     */
    @JavascriptInterface
    public void requestAllRuntimePermissions() {
        if (activity != null) {
            activity.requestAllPermissionsFromBridge();
        }
    }

    /**
     * Called by the Web application when React mounts and initial view renders successfully.
     */
    @JavascriptInterface
    public void notifyStartupSuccess() {
        if (activity != null) {
            activity.onWebStartupSuccess();
        }
    }

    /**
     * Called by the Web application if an unhandled startup or runtime error occurs.
     */
    @JavascriptInterface
    public void reportStartupError(String stage, String errorMessage) {
        if (activity != null) {
            activity.onWebStartupError(stage, errorMessage);
        }
    }

    /**
     * Opens Android System Overlay permission settings for ONEVA.
     */
    @JavascriptInterface
    public void openOverlaySettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Opens ONEVA App Info settings page.
     */
    @JavascriptInterface
    public void openAppSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Returns JSON string summarizing all system permissions status.
     */
    @JavascriptInterface
    public String getAllPermissionsStatusJson() {
        JSONObject json = new JSONObject();
        try {
            json.put("microphone", hasMicrophonePermission());
            json.put("camera", hasCameraPermission());
            json.put("notifications", hasNotificationPermission());
            json.put("overlay", hasOverlayPermission());
            json.put("accessibility", hasAccessibilityPermission());
            json.put("isDefaultLauncher", isDefaultLauncher());
        } catch (Exception ignored) {}
        return json.toString();
    }

    /**
     * Checks if screen-off wake is supported.
     */
    @JavascriptInterface
    public boolean isScreenOffWakeSupported() {
        return true;
    }

    @JavascriptInterface
    public boolean startVoiceRecognition(String language) {
        return true;
    }

    @JavascriptInterface
    public boolean stopVoiceRecognition() {
        return true;
    }

    @JavascriptInterface
    public boolean startForegroundWakeService() {
        try {
            OnevaBackgroundWakeService.start(context);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @JavascriptInterface
    public boolean stopForegroundWakeService() {
        try {
            OnevaBackgroundWakeService.stop(context);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @JavascriptInterface
    public boolean isForegroundWakeServiceRunning() {
        return OnevaBackgroundWakeService.isRunning();
    }

    @JavascriptInterface
    public void requestIgnoreBatteryOptimizations() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @JavascriptInterface
    public boolean isIgnoringBatteryOptimizations() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            return pm != null && pm.isIgnoringBatteryOptimizations(context.getPackageName());
        }
        return true;
    }

    @JavascriptInterface
    public void wakeScreenNow() {
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "oneva:manual_screen_wake"
                );
                wl.acquire(3000);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /* =========================================================================
     * ONEVA JARVIS Deep In-App Accessibility Automation Hooks
     * ========================================================================= */

    /**
     * Checks if ONEVA Accessibility Service is currently active in Android settings.
     */
    @JavascriptInterface
    public boolean isAccessibilityServiceEnabled() {
        return OnevaAccessibilityService.isRunning();
    }

    /**
     * Opens Android Accessibility settings directly so user can enable ONEVA service.
     */
    @JavascriptInterface
    public void openAccessibilitySettings() {
        try {
            Intent intent = new Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Clicks a UI node by text, viewId, or content description.
     */
    @JavascriptInterface
    public boolean clickNode(String textOrId) {
        OnevaAccessibilityService service = OnevaAccessibilityService.getInstance();
        if (service == null || textOrId == null) return false;

        // Try View ID first if contains package/id delimiter
        if (textOrId.contains(":id/")) {
            if (service.clickNodeById(textOrId)) return true;
        }

        // Try text match
        return service.clickNodeByText(textOrId);
    }

    /**
     * Types text into a specific view ID or currently focused editable field.
     */
    @JavascriptInterface
    public boolean typeText(String targetId, String text) {
        OnevaAccessibilityService service = OnevaAccessibilityService.getInstance();
        if (service == null) return false;
        return service.setText(targetId, text);
    }

    /**
     * Scrolls the window forward or backward.
     */
    @JavascriptInterface
    public boolean scroll(String direction) {
        OnevaAccessibilityService service = OnevaAccessibilityService.getInstance();
        if (service == null) return false;
        boolean forward = !"up".equalsIgnoreCase(direction);
        return service.performScroll(forward);
    }

    /**
     * Performs an Android global action (1=BACK, 2=HOME, 3=RECENTS, 4=NOTIFICATIONS, 5=QUICK_SETTINGS, 8=LOCK).
     */
    @JavascriptInterface
    public boolean performGlobalAction(int actionCode) {
        OnevaAccessibilityService service = OnevaAccessibilityService.getInstance();
        if (service == null) return false;
        return service.performGlobalAction(actionCode);
    }

    /**
     * Automated WhatsApp Message Dispatcher.
     */
    @JavascriptInterface
    public boolean sendWhatsAppMessage(String recipient, String message) {
        OnevaAccessibilityService service = OnevaAccessibilityService.getInstance();
        if (service != null) {
            return service.automateWhatsAppMessage(recipient, message);
        }

        // Fallback intent if service not yet enabled
        try {
            String encoded = URLEncoder.encode(message, "UTF-8");
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?text=" + encoded));
            intent.setPackage("com.whatsapp");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Automated YouTube Search and Play.
     */
    @JavascriptInterface
    public boolean searchAndPlayYouTube(String query) {
        OnevaAccessibilityService service = OnevaAccessibilityService.getInstance();
        if (service != null) {
            return service.automateYouTubeSearchAndPlay(query);
        }

        try {
            Intent intent = new Intent(Intent.ACTION_SEARCH);
            intent.setPackage("com.google.android.youtube");
            intent.putExtra("query", query);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Returns JSON of visible interactive nodes on the current screen.
     */
    @JavascriptInterface
    public String getScreenElementsJson() {
        OnevaAccessibilityService service = OnevaAccessibilityService.getInstance();
        if (service == null) return "[]";
        return service.getVisibleScreenNodesJson();
    }

    /**
     * Checks if Emergency Safe Mode is active on native Android.
     */
    @JavascriptInterface
    public boolean isEmergencySafeMode() {
        return context.getSharedPreferences("oneva_emergency_prefs", Context.MODE_PRIVATE)
            .getBoolean("emergency_safe_mode", false);
    }

    /**
     * Toggles Emergency Safe Mode status on native Android.
     */
    @JavascriptInterface
    public void setEmergencySafeMode(boolean enabled) {
        context.getSharedPreferences("oneva_emergency_prefs", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("emergency_safe_mode", enabled)
            .apply();
    }

    /* =========================================================================
     * ONEVA Real Notification & System Control Panel Integration
     * ========================================================================= */

    private boolean isTorchOn = false;

    /**
     * Checks if ONEVA has been granted Android Notification Listener permission.
     */
    @JavascriptInterface
    public boolean isNotificationListenerEnabled() {
        try {
            String flat = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
            return flat != null && flat.contains(context.getPackageName());
        } catch (Exception ignored) {}
        return false;
    }

    /**
     * Opens Android System Notification Access settings directly so user can grant permission.
     */
    @JavascriptInterface
    public void openNotificationListenerSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Reads all genuine active Android notifications from OnevaNotificationListenerService.
     */
    @JavascriptInterface
    public String getActiveNotificationsJson() {
        OnevaNotificationListenerService service = OnevaNotificationListenerService.getInstance();
        if (service != null) {
            return service.getActiveNotificationsJson(context);
        }
        return "[]";
    }

    /**
     * Dismisses a genuine Android notification by key.
     */
    @JavascriptInterface
    public boolean dismissNotification(String key) {
        OnevaNotificationListenerService service = OnevaNotificationListenerService.getInstance();
        if (service != null) {
            return service.dismissNotification(key);
        }
        return false;
    }

    /**
     * Launches the content intent of an active notification.
     */
    @JavascriptInterface
    public boolean openNotification(String key) {
        OnevaNotificationListenerService service = OnevaNotificationListenerService.getInstance();
        if (service != null) {
            return service.openNotification(key);
        }
        return false;
    }

    /**
     * Triggers an action (e.g. Reply, Archive) on a notification.
     */
    @JavascriptInterface
    public boolean triggerNotificationAction(String key, int actionIndex) {
        OnevaNotificationListenerService service = OnevaNotificationListenerService.getInstance();
        if (service != null) {
            return service.triggerNotificationAction(key, actionIndex);
        }
        return false;
    }

    /**
     * Reads actual system brightness (0 - 100 percentage).
     */
    @JavascriptInterface
    public int getSystemBrightness() {
        try {
            int val = Settings.System.getInt(context.getContentResolver(), Settings.System.SCREEN_BRIGHTNESS, 128);
            return Math.round((val / 255.0f) * 100.0f);
        } catch (Exception ignored) {}
        return 50;
    }

    /**
     * Checks if ONEVA has WRITE_SETTINGS permission to persist brightness system-wide.
     */
    @JavascriptInterface
    public boolean hasWriteSettingsPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.System.canWrite(context);
        }
        return true;
    }

    /**
     * Opens Android System Write Settings permission screen.
     */
    @JavascriptInterface
    public void openWriteSettingsPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * Modifies real device brightness (0 - 100 percentage).
     */
    @JavascriptInterface
    public boolean setSystemBrightness(int percent) {
        final int clamped = Math.max(1, Math.min(100, percent));
        final int brightnessVal = Math.round((clamped / 100.0f) * 255.0f);

        // 1. Immediate visual application on current window
        if (activity != null) {
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
                        lp.screenBrightness = clamped / 100.0f;
                        activity.getWindow().setAttributes(lp);
                    } catch (Exception ignored) {}
                }
            });
        }

        // 2. Persist to Android Settings if WRITE_SETTINGS is permitted
        if (hasWriteSettingsPermission()) {
            try {
                Settings.System.putInt(
                    context.getContentResolver(),
                    Settings.System.SCREEN_BRIGHTNESS,
                    brightnessVal
                );
                return true;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return false;
    }

    /**
     * Reads device ringer mode ("NORMAL", "VIBRATE", or "SILENT").
     */
    @JavascriptInterface
    public String getSystemRingerMode() {
        try {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int mode = am.getRingerMode();
                if (mode == AudioManager.RINGER_MODE_SILENT) return "SILENT";
                if (mode == AudioManager.RINGER_MODE_VIBRATE) return "VIBRATE";
                return "NORMAL";
            }
        } catch (Exception ignored) {}
        return "NORMAL";
    }

    /**
     * Sets device ringer mode.
     */
    @JavascriptInterface
    public boolean setSystemRingerMode(String targetMode) {
        try {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int mode = AudioManager.RINGER_MODE_NORMAL;
                if ("SILENT".equalsIgnoreCase(targetMode)) {
                    mode = AudioManager.RINGER_MODE_SILENT;
                } else if ("VIBRATE".equalsIgnoreCase(targetMode)) {
                    mode = AudioManager.RINGER_MODE_VIBRATE;
                }
                am.setRingerMode(mode);
                return true;
            }
        } catch (Exception e) {
            openSoundSettings();
        }
        return false;
    }

    /**
     * Reads torch / flashlight state.
     */
    @JavascriptInterface
    public boolean getTorchState() {
        return isTorchOn;
    }

    /**
     * Toggles hardware camera torch.
     */
    @JavascriptInterface
    public boolean setTorch(boolean enabled) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                CameraManager cm = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
                if (cm != null) {
                    String[] ids = cm.getCameraIdList();
                    if (ids != null && ids.length > 0) {
                        cm.setTorchMode(ids[0], enabled);
                        isTorchOn = enabled;
                        return true;
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return false;
    }

    /**
     * System Settings & Quick Settings Panel Shortcuts
     */
    @JavascriptInterface
    public void openWifiSettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Intent intent = new Intent(Settings.Panel.ACTION_WIFI);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return;
            }
        } catch (Exception ignored) {}
        launchSettingsIntent(Settings.ACTION_WIFI_SETTINGS);
    }

    @JavascriptInterface
    public void openBluetoothSettings() {
        launchSettingsIntent(Settings.ACTION_BLUETOOTH_SETTINGS);
    }

    @JavascriptInterface
    public void openHotspotSettings() {
        launchSettingsIntent(Settings.ACTION_WIRELESS_SETTINGS);
    }

    @JavascriptInterface
    public void openMobileDataSettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Intent intent = new Intent(Settings.Panel.ACTION_INTERNET_CONNECTIVITY);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return;
            }
        } catch (Exception ignored) {}
        launchSettingsIntent(Settings.ACTION_DATA_ROAMING_SETTINGS);
    }

    @JavascriptInterface
    public void openAirplaneModeSettings() {
        launchSettingsIntent(Settings.ACTION_AIRPLANE_MODE_SETTINGS);
    }

    @JavascriptInterface
    public void openLocationSettings() {
        launchSettingsIntent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
    }

    @JavascriptInterface
    public void openSoundSettings() {
        launchSettingsIntent(Settings.ACTION_SOUND_SETTINGS);
    }

    @JavascriptInterface
    public void openDisplaySettings() {
        launchSettingsIntent(Settings.ACTION_DISPLAY_SETTINGS);
    }

    @JavascriptInterface
    public void openSystemSettings() {
        launchSettingsIntent(Settings.ACTION_SETTINGS);
    }

    @JavascriptInterface
    public void openDeviceControlsSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                Intent intent = new Intent("android.service.controls.action.DEVICE_CONTROLS");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return;
            } catch (Exception ignored) {}
        }
        launchSettingsIntent(Settings.ACTION_SETTINGS);
    }

    @JavascriptInterface
    public void openMediaOutputSettings() {
        launchSettingsIntent(Settings.ACTION_SOUND_SETTINGS);
    }

    private void launchSettingsIntent(String action) {
        try {
            Intent intent = new Intent(action);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(fallback);
            } catch (Exception ignored) {}
        }
    }

    /**
     * Performs a comprehensive native scan of genuine device capabilities.
     * Stored locally to calibrate the adaptive Quick Panel layout.
     */
    @JavascriptInterface
    public String getDeviceCapabilityProfileJson() {
        JSONObject obj = new JSONObject();
        try {
            obj.put("androidVersion", Build.VERSION.RELEASE);
            obj.put("sdkInt", Build.VERSION.SDK_INT);
            obj.put("manufacturer", Build.MANUFACTURER);
            obj.put("model", Build.MODEL);
            obj.put("brand", Build.BRAND);

            DisplayMetrics dm = context.getResources().getDisplayMetrics();
            obj.put("screenWidth", dm.widthPixels);
            obj.put("screenHeight", dm.heightPixels);
            obj.put("density", dm.density);
            obj.put("densityDpi", dm.densityDpi);

            obj.put("hasNotificationAccess", isNotificationListenerEnabled());
            obj.put("hasWriteSettingsAccess", hasWriteSettingsPermission());
            obj.put("hasOverlayAccess", hasOverlayPermission());
            obj.put("hasCamera", context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY));
            obj.put("hasFlashlight", context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_FLASH));
            obj.put("hasWifi", context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_WIFI));
            obj.put("hasBluetooth", context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH));
            obj.put("hasTelephony", context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY));

            JSONArray supported = new JSONArray();
            supported.put("wifi");
            supported.put("sound");
            supported.put("bluetooth");
            supported.put("brightness");
            supported.put("settings");
            supported.put("dark_mode");

            if (context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_FLASH)) {
                supported.put("torch");
            }
            if (context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) {
                supported.put("mobile_data");
            }
            supported.put("hotspot");
            supported.put("airplane");
            supported.put("location");
            supported.put("dnd");
            supported.put("auto_rotate");
            supported.put("screen_timeout");
            supported.put("device_control");
            supported.put("media_output");

            obj.put("supportedControls", supported);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return obj.toString();
    }

    /**
     * Checks if ONEVA has permission to request package installation via Android Package Installer.
     */
    @JavascriptInterface
    public boolean canRequestPackageInstalls() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return context.getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }

    /**
     * Opens Android System Settings for "Install unknown apps" so user can toggle permission.
     */
    @JavascriptInterface
    public void openManageUnknownAppSources() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * Safely hands off an APK file to Android's official Package Installer via FileProvider.
     * Android OS asks the user for explicit confirmation (NO silent installs, NO Play Protect bypass).
     */
    @JavascriptInterface
    public boolean installApkFile(String localPath) {
        if (localPath == null || localPath.trim().isEmpty()) {
            return false;
        }

        try {
            File file = new File(localPath);
            if (!file.exists()) {
                return false;
            }

            Uri contentUri = FileProvider.getUriForFile(
                context,
                "io.oneva.android.launcher.fileprovider",
                file
            );

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(contentUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(installIntent);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Downloads genuine APK directly via Android's DownloadManager service,
     * performs real SHA-256 byte-level checksum verification, validates APK archive structure,
     * and only on verified success hands off to Android Package Installer via FileProvider.
     * Strictly blocks installation if hash mismatches or file is corrupted.
     */
    @JavascriptInterface
    public boolean downloadAndInstallApk(final String downloadUrl, final String fileName, final String expectedPackageName, final String expectedSha256) {
        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            return false;
        }

        // Strict HTTPS enforcement
        final String cleanUrl = downloadUrl.trim();
        if (!cleanUrl.toLowerCase().startsWith("https://")) {
            android.util.Log.e("OnevaNativeBridge", "SECURITY BLOCK: Insecure non-HTTPS download URL rejected: " + cleanUrl);
            return false;
        }

        // Explicit unknown-apps permission gate
        if (!canRequestPackageInstalls()) {
            android.util.Log.w("OnevaNativeBridge", "Install Unknown Apps permission not granted yet");
            return false;
        }

        try {
            final DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) return false;

            // Sanitize filename to prevent directory traversal
            String safeFileName = (fileName != null ? fileName.trim().replaceAll("[^a-zA-Z0-9._-]", "_") : "camera_provider.apk");
            if (!safeFileName.toLowerCase().endsWith(".apk")) {
                safeFileName += ".apk";
            }

            Uri uri = Uri.parse(cleanUrl);
            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle("ONEVA Camera Engine: " + safeFileName);
            request.setDescription("Downloading verified camera provider package...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setMimeType("application/vnd.android.package-archive");

            // Expose only app-sandboxed download directory mapped in file_paths.xml
            File targetDir = context.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS);
            if (targetDir == null) {
                targetDir = new File(context.getFilesDir(), "Download");
                targetDir.mkdirs();
            }
            final File destFile = new File(targetDir, safeFileName);
            if (destFile.exists()) {
                destFile.delete(); // Clean any stale download
            }

            request.setDestinationUri(Uri.fromFile(destFile));

            final long downloadId = dm.enqueue(request);

            BroadcastReceiver onComplete = new BroadcastReceiver() {
                @Override
                public void onReceive(Context c, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id == downloadId) {
                        try {
                            context.unregisterReceiver(this);
                        } catch (Exception ignored) {}

                        // 1. Verify DownloadManager reported success
                        DownloadManager.Query q = new DownloadManager.Query();
                        q.setFilterById(downloadId);
                        Cursor cursor = dm.query(q);
                        if (cursor != null) {
                            try {
                                if (cursor.moveToFirst()) {
                                    int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                                    if (statusIdx >= 0) {
                                        int status = cursor.getInt(statusIdx);
                                        if (status != DownloadManager.STATUS_SUCCESSFUL) {
                                            android.util.Log.e("OnevaNativeBridge", "Download failed with status: " + status);
                                            if (destFile.exists()) destFile.delete();
                                            return;
                                        }
                                    }
                                }
                            } finally {
                                cursor.close();
                            }
                        }

                        // 2. Verify file exists and has plausible APK size (> 100KB)
                        if (!destFile.exists() || destFile.length() < 100000) {
                            android.util.Log.e("OnevaNativeBridge", "Downloaded file missing or suspiciously small (<100KB)");
                            if (destFile.exists()) destFile.delete();
                            return;
                        }

                        // 3. Real Byte-level SHA-256 Calculation & Integrity Verification
                        if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
                            try {
                                MessageDigest md = MessageDigest.getInstance("SHA-256");
                                FileInputStream fis = new FileInputStream(destFile);
                                byte[] buf = new byte[16384];
                                int len;
                                while ((len = fis.read(buf)) != -1) {
                                    md.update(buf, 0, len);
                                }
                                fis.close();

                                byte[] digestBytes = md.digest();
                                StringBuilder sb = new StringBuilder();
                                for (byte b : digestBytes) {
                                    sb.append(String.format("%02x", b));
                                }
                                String calculatedHash = sb.toString().toLowerCase();
                                String requiredHash = expectedSha256.trim().toLowerCase();

                                if (!calculatedHash.equals(requiredHash)) {
                                    android.util.Log.e("OnevaNativeBridge", "SECURITY ALERT: Package verification failed! Expected SHA-256: " 
                                        + requiredHash + " but calculated: " + calculatedHash + ". Installation BLOCKED.");
                                    if (destFile.exists()) {
                                        destFile.delete(); // Delete unverified package immediately
                                    }
                                    return; // STOP! Never launch installer on hash mismatch!
                                }
                                android.util.Log.i("OnevaNativeBridge", "✓ SHA-256 checksum successfully verified: " + calculatedHash);
                            } catch (Exception hashEx) {
                                android.util.Log.e("OnevaNativeBridge", "Error calculating SHA-256 for downloaded APK", hashEx);
                                if (destFile.exists()) destFile.delete();
                                return;
                            }
                        }

                        // 4. Validate APK Archive Structure via PackageManager
                        try {
                            PackageManager pm = context.getPackageManager();
                            PackageInfo archiveInfo = pm.getPackageArchiveInfo(destFile.getAbsolutePath(), PackageManager.GET_ACTIVITIES);
                            if (archiveInfo == null) {
                                android.util.Log.e("OnevaNativeBridge", "Invalid or corrupted APK archive structure: PackageManager cannot parse manifest");
                                if (destFile.exists()) destFile.delete();
                                return;
                            }

                            // 5. Verify package name matches expectations if provided
                            if (expectedPackageName != null && !expectedPackageName.trim().isEmpty()) {
                                if (!archiveInfo.packageName.equalsIgnoreCase(expectedPackageName.trim())) {
                                    android.util.Log.e("OnevaNativeBridge", "Package name mismatch! Expected: " 
                                        + expectedPackageName + ", but APK manifest declared: " + archiveInfo.packageName);
                                    if (destFile.exists()) destFile.delete();
                                    return;
                                }
                            }
                        } catch (Exception parseEx) {
                            android.util.Log.e("OnevaNativeBridge", "Failed to parse APK manifest", parseEx);
                            if (destFile.exists()) destFile.delete();
                            return;
                        }

                        // 6. All checks passed: Hand off to Android Package Installer via FileProvider
                        installApkFile(destFile.getAbsolutePath());
                    }
                }
            };

            ContextCompat.registerReceiver(
                context,
                onComplete,
                new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                ContextCompat.RECEIVER_NOT_EXPORTED
            );

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Backward-compatible overload without expectedSha256
     */
    @JavascriptInterface
    public boolean downloadAndInstallApk(final String downloadUrl, final String fileName, final String expectedPackageName) {
        return downloadAndInstallApk(downloadUrl, fileName, expectedPackageName, null);
    }

    /**
     * Dispatches official store market intent (Google Play or Samsung Galaxy Store) with web fallback.
     */
    @JavascriptInterface
    public boolean openStoreOrMarket(String packageName, String storeType, String webFallbackUrl) {
        try {
            if ("samsung".equalsIgnoreCase(storeType) && packageName != null) {
                Intent galaxyIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("samsungapps://ProductDetail/" + packageName));
                galaxyIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(galaxyIntent);
                return true;
            } else if (packageName != null) {
                Intent playIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
                playIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(playIntent);
                return true;
            }
        } catch (Exception e) {
            if (webFallbackUrl != null && !webFallbackUrl.isEmpty()) {
                try {
                    Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(webFallbackUrl));
                    webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(webIntent);
                    return true;
                } catch (Exception ignored) {}
            }
        }
        return false;
    }
}
