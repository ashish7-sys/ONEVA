package io.oneva.android.launcher;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "ONEVA_MAIN";
    private static final String APP_URL = "https://appassets.androidplatform.net/index.html";

    private static final int PERMISSION_REQ_CAMERA = 1001;
    private static final int PERMISSION_REQ_MIC = 1002;
    private static final int PERMISSION_REQ_ALL = 1003;

    private static MainActivity instance = null;

    private FrameLayout rootContainer;
    private WebView webView;
    private ScrollView diagnosticScrollView;
    private TextView diagnosticStageText;
    private TextView diagnosticStatusText;
    private TextView diagnosticDetailsText;

    private OnevaNativeBridge nativeBridge;
    private WebViewAssetLoader assetLoader;
    private PermissionRequest pendingWebPermissionRequest = null;

    private boolean isStartupConfirmed = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable startupWatchdogRunnable = null;

    public static MainActivity getInstance() {
        return instance;
    }

    public static void notifyBackgroundWakeWordDetected(final String wakeWord) {
        if (instance != null && instance.webView != null) {
            instance.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    String sanitized = wakeWord != null ? wakeWord.replace("'", "\\'") : "Jarvis";
                    String script = String.format(
                        "if (window.dispatchEvent) { window.dispatchEvent(new CustomEvent('oneva-background-wake-detected', { detail: { wakeName: '%s', isScreenOff: true } })); }",
                        sanitized
                    );
                    instance.webView.evaluateJavascript(script, null);
                }
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;

        // Configure edge-to-edge transparent system bars without screen-lock overrides
        configureSystemBars();

        // 1. Root Layout Container
        rootContainer = new FrameLayout(this);
        rootContainer.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        rootContainer.setBackgroundColor(Color.parseColor("#09090b"));

        // 2. Primary WebView Surface
        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        webView.setBackgroundColor(Color.parseColor("#09090b"));
        rootContainer.addView(webView);

        // 3. Native Debug Safety Layer (Diagnostic UI, hidden by default)
        diagnosticScrollView = createDiagnosticOverlay();
        diagnosticScrollView.setVisibility(View.GONE);
        rootContainer.addView(diagnosticScrollView);

        setContentView(rootContainer);

        // 4. Configure WebView Settings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 5. Register Native JavaScript Bridges
        nativeBridge = new OnevaNativeBridge(this, webView);
        webView.addJavascriptInterface(nativeBridge, "OnevaNativeBridge");
        webView.addJavascriptInterface(nativeBridge, "OnevaAccessibilityBridge");

        // 6. Modern local asset loader to serve bundled Vite files safely over HTTPS origin
        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain("appassets.androidplatform.net")
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        // 7. Robust WebViewClient with intercept fallback and error catching
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();

                // Primary: Android WebKit AssetLoader
                WebResourceResponse response = assetLoader.shouldInterceptRequest(url);
                if (response != null) {
                    return response;
                }

                // Resilient Secondary Fallback for direct APK assets
                if ("appassets.androidplatform.net".equals(url.getHost())) {
                    String path = url.getPath();
                    if (path != null) {
                        if (path.startsWith("/")) {
                            path = path.substring(1);
                        }
                        if (path.isEmpty()) {
                            path = "index.html";
                        }
                        try {
                            String mimeType = getMimeTypeFromPath(path);
                            InputStream is = getAssets().open(path);
                            return new WebResourceResponse(mimeType, "UTF-8", is);
                        } catch (Exception e) {
                            // SPA route fallback: serve index.html for non-file routes
                            if (!path.contains(".") || path.endsWith(".html")) {
                                try {
                                    InputStream is = getAssets().open("index.html");
                                    return new WebResourceResponse("text/html", "UTF-8", is);
                                } catch (Exception ignored) {}
                            }
                        }
                    }
                }
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("https://appassets.androidplatform.net/") ||
                    url.startsWith("file:///android_asset/")) {
                    return false;
                }
                // Handle external links safely via system browser
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "WebView page finished loading: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    String desc = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? String.valueOf(error.getDescription()) : "Unknown error";
                    int code = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? error.getErrorCode() : -1;
                    Log.e(TAG, "WebView main frame load error: " + desc + " (code: " + code + ") for url: " + request.getUrl());
                    showDiagnosticFallback(
                        "WebView Main Frame Error (" + code + ")",
                        "Failed to load resource: " + request.getUrl() + "\nDescription: " + desc
                    );
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request != null && request.isForMainFrame()) {
                    int statusCode = errorResponse != null ? errorResponse.getStatusCode() : 500;
                    if (statusCode >= 400) {
                        Log.e(TAG, "WebView HTTP error " + statusCode + " for main frame: " + request.getUrl());
                        showDiagnosticFallback(
                            "HTTP " + statusCode + " Error",
                            "Server returned error code " + statusCode + " for: " + request.getUrl()
                        );
                    }
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                boolean didCrash = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && detail.didCrash();
                Log.e(TAG, "WebView render process gone! Did crash: " + didCrash);
                showDiagnosticFallback(
                    "WebView Renderer Terminated",
                    "The Chromium WebView render process was terminated (didCrash: " + didCrash + ").\nTap 'Retry Startup' to reinitialize."
                );
                return true;
            }
        });

        // 8. WebChromeClient for on-demand permissions & console error diagnostics
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        handleWebPermissionRequest(request);
                    }
                });
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                String msg = consoleMessage.message();
                int line = consoleMessage.lineNumber();
                String src = consoleMessage.sourceId();

                if (consoleMessage.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
                    Log.e(TAG, "JS Error [" + src + ":" + line + "]: " + msg);
                    // Check if critical JS bundle failed to execute
                    if (!isStartupConfirmed && (msg.contains("SyntaxError") || msg.contains("Failed to fetch") || msg.contains("Cannot find module"))) {
                        showDiagnosticFallback("JavaScript Execution Failure", "Error: " + msg + "\nSource: " + src + " (Line " + line + ")");
                    }
                } else {
                    Log.d(TAG, "JS [" + src + ":" + line + "]: " + msg);
                }
                return true;
            }
        });

        // 9. Load local application over HTTPS origin (resolves ES modules, CORS, and storage)
        Log.i(TAG, "Initiating ONEVA application load: " + APP_URL);
        webView.loadUrl(APP_URL);

        // 10. Startup Watchdog Timer (10 seconds): alerts user with diagnostic if page completely fails to mount
        startupWatchdogRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isStartupConfirmed && !isFinishing() && !isDestroyed()) {
                    if (webView != null) {
                        webView.evaluateJavascript(
                            "Boolean(document.getElementById('root') && document.getElementById('root').children.length > 0)",
                            new ValueCallback<String>() {
                                @Override
                                public void onReceiveValue(String value) {
                                    if ("true".equalsIgnoreCase(value)) {
                                        onWebStartupSuccess();
                                    } else {
                                        showDiagnosticFallback(
                                            "Startup Render Timeout (10s)",
                                            "Application bundle loaded, but React DOM root remained empty after 10 seconds.\n" +
                                            "Current URL: " + (webView != null ? webView.getUrl() : "none") + "\n" +
                                            "Please check console logs or tap 'Retry Startup'."
                                        );
                                    }
                                }
                            }
                        );
                    }
                }
            }
        };
        mainHandler.postDelayed(startupWatchdogRunnable, 10000);

        // 11. Launcher back button behavior: do not exit launcher on back press
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (diagnosticScrollView != null && diagnosticScrollView.getVisibility() == View.VISIBLE) {
                    diagnosticScrollView.setVisibility(View.GONE);
                    return;
                }
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    // Home launcher stays on home
                }
            }
        });
    }

    private String getMimeTypeFromPath(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "text/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    private void handleWebPermissionRequest(PermissionRequest request) {
        try {
            List<String> grantedResources = new ArrayList<>();
            List<String> neededAndroidPermissions = new ArrayList<>();

            for (String resource : request.getResources()) {
                if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        grantedResources.add(resource);
                    } else {
                        neededAndroidPermissions.add(Manifest.permission.RECORD_AUDIO);
                    }
                } else if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        grantedResources.add(resource);
                    } else {
                        neededAndroidPermissions.add(Manifest.permission.CAMERA);
                    }
                } else {
                    grantedResources.add(resource);
                }
            }

            if (neededAndroidPermissions.isEmpty()) {
                request.grant(grantedResources.toArray(new String[0]));
            } else {
                pendingWebPermissionRequest = request;
                ActivityCompat.requestPermissions(
                    this,
                    neededAndroidPermissions.toArray(new String[0]),
                    PERMISSION_REQ_ALL
                );
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling WebChromeClient onPermissionRequest", e);
            try {
                request.deny();
            } catch (Exception ignored) {}
        }
    }

    public void onWebStartupSuccess() {
        isStartupConfirmed = true;
        if (startupWatchdogRunnable != null) {
            mainHandler.removeCallbacks(startupWatchdogRunnable);
            startupWatchdogRunnable = null;
        }
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (diagnosticScrollView != null) {
                    diagnosticScrollView.setVisibility(View.GONE);
                }
            }
        });
        Log.i(TAG, "ONEVA Web Application startup successfully verified.");
    }

    public void onWebStartupError(final String stage, final String errorMessage) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                showDiagnosticFallback(stage, errorMessage);
            }
        });
    }

    private void showDiagnosticFallback(String stage, String details) {
        if (isFinishing() || isDestroyed()) return;

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (diagnosticStageText != null) {
                    diagnosticStageText.setText("Stage: " + (stage != null ? stage : "Application Startup"));
                }
                if (diagnosticStatusText != null) {
                    boolean mic = ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
                    boolean cam = ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
                    boolean overlay = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(MainActivity.this);
                    String url = webView != null ? String.valueOf(webView.getUrl()) : "null";

                    diagnosticStatusText.setText(String.format(
                        "WebView Status: %s\nPermissions: Camera: %s | Mic: %s | Overlay: %s",
                        url,
                        cam ? "Granted" : "Not Granted",
                        mic ? "Granted" : "Not Granted",
                        overlay ? "Granted" : "Not Granted"
                    ));
                }
                if (diagnosticDetailsText != null) {
                    diagnosticDetailsText.setText(details != null ? details : "No additional exception details available.");
                }
                if (diagnosticScrollView != null) {
                    diagnosticScrollView.setVisibility(View.VISIBLE);
                    diagnosticScrollView.bringToFront();
                }
            }
        });
    }

    private ScrollView createDiagnosticOverlay() {
        ScrollView scrollView = new ScrollView(this);
        scrollView.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        scrollView.setBackgroundColor(Color.parseColor("#09090b"));
        scrollView.setFillViewport(true);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(48, 64, 48, 64);
        layout.setGravity(Gravity.CENTER_HORIZONTAL);

        // Header Title
        TextView titleView = new TextView(this);
        titleView.setText("ONEVA startup failed");
        titleView.setTextColor(Color.parseColor("#ef4444"));
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        titleView.setGravity(Gravity.CENTER);
        layout.addView(titleView);

        // Subtitle badge
        TextView subtitleView = new TextView(this);
        subtitleView.setText("NATIVE DEBUG SAFETY LAYER");
        subtitleView.setTextColor(Color.parseColor("#10b981"));
        subtitleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        subtitleView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        subtitleView.setPadding(0, 12, 0, 24);
        subtitleView.setGravity(Gravity.CENTER);
        layout.addView(subtitleView);

        // Failure Stage Text
        diagnosticStageText = new TextView(this);
        diagnosticStageText.setText("Stage: Initializing WebView & Asset Loader");
        diagnosticStageText.setTextColor(Color.parseColor("#f59e0b"));
        diagnosticStageText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        diagnosticStageText.setTypeface(Typeface.DEFAULT_BOLD);
        diagnosticStageText.setPadding(0, 8, 0, 16);
        layout.addView(diagnosticStageText);

        // System & WebView Status
        diagnosticStatusText = new TextView(this);
        diagnosticStatusText.setText("WebView Status: Loading\nPermissions: Checking...");
        diagnosticStatusText.setTextColor(Color.parseColor("#94a3b8"));
        diagnosticStatusText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        diagnosticStatusText.setTypeface(Typeface.MONOSPACE);
        diagnosticStatusText.setPadding(0, 0, 0, 24);
        layout.addView(diagnosticStatusText);

        // Error message code block box
        LinearLayout boxLayout = new LinearLayout(this);
        boxLayout.setOrientation(LinearLayout.VERTICAL);
        boxLayout.setBackgroundColor(Color.parseColor("#18181b"));
        boxLayout.setPadding(32, 32, 32, 32);

        diagnosticDetailsText = new TextView(this);
        diagnosticDetailsText.setText("No errors logged.");
        diagnosticDetailsText.setTextColor(Color.parseColor("#e2e8f0"));
        diagnosticDetailsText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        diagnosticDetailsText.setTypeface(Typeface.MONOSPACE);
        boxLayout.addView(diagnosticDetailsText);
        layout.addView(boxLayout);

        // Action Buttons Row
        LinearLayout buttonRow = new LinearLayout(this);
        buttonRow.setOrientation(LinearLayout.HORIZONTAL);
        buttonRow.setPadding(0, 32, 0, 16);
        buttonRow.setGravity(Gravity.CENTER);

        Button retryButton = new Button(this);
        retryButton.setText("Retry Startup");
        retryButton.setBackgroundColor(Color.parseColor("#059669"));
        retryButton.setTextColor(Color.WHITE);
        retryButton.setPadding(32, 16, 32, 16);
        retryButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                diagnosticScrollView.setVisibility(View.GONE);
                if (webView != null) {
                    webView.clearCache(true);
                    webView.loadUrl(APP_URL);
                }
            }
        });
        buttonRow.addView(retryButton);

        Button settingsButton = new Button(this);
        settingsButton.setText("App Settings");
        settingsButton.setBackgroundColor(Color.parseColor("#27272a"));
        settingsButton.setTextColor(Color.parseColor("#cbd5e1"));
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        btnParams.setMargins(24, 0, 0, 0);
        settingsButton.setLayoutParams(btnParams);
        settingsButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception ignored) {}
            }
        });
        buttonRow.addView(settingsButton);

        layout.addView(buttonRow);
        scrollView.addView(layout);
        return scrollView;
    }

    private void configureSystemBars() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
        } else {
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
    }

    public void requestCameraPermissionFromBridge() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.CAMERA}, PERMISSION_REQ_CAMERA);
                }
            }
        });
    }

    public void requestMicrophonePermissionFromBridge() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.RECORD_AUDIO}, PERMISSION_REQ_MIC);
                }
            }
        });
    }

    public void requestAllPermissionsFromBridge() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                List<String> list = new ArrayList<>();
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    list.add(Manifest.permission.RECORD_AUDIO);
                }
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    list.add(Manifest.permission.CAMERA);
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        list.add(Manifest.permission.POST_NOTIFICATIONS);
                    }
                }
                if (!list.isEmpty()) {
                    ActivityCompat.requestPermissions(MainActivity.this, list.toArray(new String[0]), PERMISSION_REQ_ALL);
                }
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        // Resolve any pending WebChromeClient PermissionRequest safely
        if (pendingWebPermissionRequest != null) {
            try {
                List<String> granted = new ArrayList<>();
                for (String res : pendingWebPermissionRequest.getResources()) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)) {
                        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                            granted.add(res);
                        }
                    } else if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res)) {
                        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                            granted.add(res);
                        }
                    }
                }
                if (!granted.isEmpty()) {
                    pendingWebPermissionRequest.grant(granted.toArray(new String[0]));
                } else {
                    pendingWebPermissionRequest.deny();
                }
            } catch (Exception e) {
                Log.e(TAG, "Error resolving pendingWebPermissionRequest", e);
            }
            pendingWebPermissionRequest = null;
        }

        // Notify Web application of updated permissions so UI refreshes seamlessly
        if (webView != null) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript(
                        "if (window.dispatchEvent) { window.dispatchEvent(new CustomEvent('oneva-permissions-updated')); }",
                        null
                    );
                }
            });
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getBooleanExtra("TRIGGER_VOICE_WAKE", false)) {
            String wakeWord = intent.getStringExtra("WAKE_WORD");
            notifyBackgroundWakeWordDetected(wakeWord);
        }
    }

    private boolean isVolumeUpPressed = false;
    private boolean isVolumeDownPressed = false;
    private int emergencyTapCount = 0;
    private long lastEmergencyTapTime = 0;

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        int action = event.getAction();

        if (keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
            if (action == KeyEvent.ACTION_DOWN) {
                isVolumeUpPressed = true;
            } else if (action == KeyEvent.ACTION_UP) {
                isVolumeUpPressed = false;
                emergencyTapCount = 0;
            }
        } else if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
            if (action == KeyEvent.ACTION_DOWN) {
                isVolumeDownPressed = true;
            } else if (action == KeyEvent.ACTION_UP) {
                isVolumeDownPressed = false;
                emergencyTapCount = 0;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev.getAction() == MotionEvent.ACTION_DOWN) {
            if (isVolumeUpPressed && isVolumeDownPressed) {
                long now = System.currentTimeMillis();
                if (emergencyTapCount > 0 && now - lastEmergencyTapTime > 3000) {
                    emergencyTapCount = 1;
                } else {
                    emergencyTapCount++;
                }
                lastEmergencyTapTime = now;

                if (emergencyTapCount >= 5) {
                    emergencyTapCount = 0;
                    triggerEmergencyReset();
                }
            }
        }
        return super.dispatchTouchEvent(ev);
    }

    public void triggerEmergencyReset() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (webView != null) {
                    webView.evaluateJavascript(
                        "if (window.dispatchEvent) { window.dispatchEvent(new CustomEvent('oneva-emergency-reset-native')); }",
                        null
                    );
                }
                Toast.makeText(
                    MainActivity.this,
                    "ONEVA Emergency Reset Triggered: Safe Mode Active",
                    Toast.LENGTH_LONG
                ).show();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (startupWatchdogRunnable != null) {
            mainHandler.removeCallbacks(startupWatchdogRunnable);
            startupWatchdogRunnable = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
