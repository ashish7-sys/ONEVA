package io.oneva.android.launcher;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.BatteryManager;
import android.os.Build;
import android.webkit.JavascriptInterface;
import org.json.JSONArray;
import org.json.JSONObject;

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
 * - Default launcher status verification
 */
public class OnevaNativeBridge {

    private final Context context;

    public OnevaNativeBridge(Context context) {
        this.context = context.getApplicationContext();
    }

    /**
     * Scans the Android device for genuine installed applications.
     * 
     * Uses PackageManager with Intent.ACTION_MAIN + CATEGORY_LAUNCHER.
     * Compatible with Android 11+ (API Level 30+) provided that QUERY_ALL_PACKAGES
     * or Launcher category intent filters are declared in AndroidManifest.xml.
     * 
     * @return JSON string containing array of installed application descriptors
     */
    @JavascriptInterface
    public String getInstalledApps() {
        JSONArray appsArray = new JSONArray();
        try {
            PackageManager pm = context.getPackageManager();

            // Intent to query all launchable user-facing activities
            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> resolveInfoList = pm.queryIntentActivities(
                mainIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PackageManager.MATCH_ALL : 0
            );

            // Sort alphabetically by application label
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
     * Triggers the Android system dialog to set ONEVA as the default home launcher.
     */
    @JavascriptInterface
    public void requestSetDefaultLauncher() {
        try {
            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_HOME);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
