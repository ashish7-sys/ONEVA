package io.oneva.android.launcher;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * ONEVA JARVIS Real Screen-Off & Background Wake Foreground Service
 * 
 * Provides true production-grade screen-off audio listening on genuine Android devices:
 * - Persistent Foreground Service with low-power system notification
 * - Partial WakeLock to keep CPU alive when display powers down
 * - Continuous background speech recognition loop
 * - Screen Wake-Up (SCREEN_BRIGHT_WAKE_LOCK + ACQUIRE_CAUSES_WAKEUP)
 * - Tactile dual-pulse haptic feedback on wake word detection
 * - Direct launcher wake-up & JavaScript bridge event dispatch
 */
public class OnevaBackgroundWakeService extends Service {

    public static final String ACTION_START = "io.oneva.android.launcher.action.START_WAKE_SERVICE";
    public static final String ACTION_STOP = "io.oneva.android.launcher.action.STOP_WAKE_SERVICE";
    public static final String ACTION_UPDATE_WAKE_WORDS = "io.oneva.android.launcher.action.UPDATE_WAKE_WORDS";
    public static final String EXTRA_WAKE_WORDS = "extra_wake_words";

    private static final String CHANNEL_ID = "oneva_background_wake_channel";
    private static final int NOTIFICATION_ID = 2099;

    private static boolean isServiceRunning = false;
    private static OnevaBackgroundWakeService instance = null;

    private PowerManager.WakeLock cpuWakeLock = null;
    private Handler mainHandler = null;
    private SpeechRecognizer speechRecognizer = null;
    private Intent recognizerIntent = null;
    private boolean isListening = false;
    private boolean shouldContinueListening = false;

    private final Set<String> activeWakeWords = new HashSet<>(Arrays.asList(
        "jarvis", "friday", "ultron", "boss", "siri", "alexa", "hey jarvis"
    ));

    public static boolean isRunning() {
        return isServiceRunning;
    }

    public static OnevaBackgroundWakeService getInstance() {
        return instance;
    }

    public static void start(Context context) {
        Intent intent = new Intent(context, OnevaBackgroundWakeService.class);
        intent.setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stop(Context context) {
        Intent intent = new Intent(context, OnevaBackgroundWakeService.class);
        intent.setAction(ACTION_STOP);
        context.stopService(intent);
    }

    public static void updateWakeWords(Context context, ArrayList<String> words) {
        Intent intent = new Intent(context, OnevaBackgroundWakeService.class);
        intent.setAction(ACTION_UPDATE_WAKE_WORDS);
        intent.putStringArrayListExtra(EXTRA_WAKE_WORDS, words);
        context.startService(intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        mainHandler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
        acquireCpuWakeLock();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP.equals(action)) {
                stopSelf();
                return START_NOT_STICKY;
            } else if (ACTION_UPDATE_WAKE_WORDS.equals(action)) {
                ArrayList<String> words = intent.getStringArrayListExtra(EXTRA_WAKE_WORDS);
                if (words != null && !words.isEmpty()) {
                    activeWakeWords.clear();
                    for (String w : words) {
                        if (w != null && !w.trim().isEmpty()) {
                            activeWakeWords.add(w.trim().toLowerCase());
                        }
                    }
                }
            }
        }

        Notification notification = buildForegroundNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        isServiceRunning = true;
        shouldContinueListening = true;

        mainHandler.post(this::initAndStartSpeechRecognition);

        return START_STICKY;
    }

    private void acquireCpuWakeLock() {
        if (cpuWakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                cpuWakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "oneva:JARVIS_ScreenOff_WakeLock"
                );
                cpuWakeLock.setReferenceCounted(false);
                try {
                    cpuWakeLock.acquire();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private void releaseCpuWakeLock() {
        if (cpuWakeLock != null && cpuWakeLock.isHeld()) {
            try {
                cpuWakeLock.release();
            } catch (Exception e) {
                e.printStackTrace();
            }
            cpuWakeLock = null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "ONEVA JARVIS Background Voice",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps JARVIS listening for your wake word when screen is turned off.");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildForegroundNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ONEVA JARVIS • Screen-Off Wake Active")
            .setContentText("Listening for 'Jarvis' while phone is locked...")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    private void initAndStartSpeechRecognition() {
        if (!shouldContinueListening) return;

        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception ignored) {}
            speechRecognizer = null;
        }

        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            // SpeechRecognizer not present; continue maintaining WakeLock and event readiness
            return;
        }

        try {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            recognizerIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
            recognizerIntent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());

            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) { isListening = true; }
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() { isListening = false; }

                @Override
                public void onError(int error) {
                    isListening = false;
                    restartListeningWithBackoff(350);
                }

                @Override
                public void onResults(Bundle results) {
                    isListening = false;
                    processRecognitionBundle(results);
                    restartListeningWithBackoff(250);
                }

                @Override
                public void onPartialResults(Bundle partialResults) {
                    processRecognitionBundle(partialResults);
                }

                @Override public void onEvent(int eventType, Bundle params) {}
            });

            speechRecognizer.startListening(recognizerIntent);
            isListening = true;
        } catch (Exception e) {
            e.printStackTrace();
            restartListeningWithBackoff(1000);
        }
    }

    private void processRecognitionBundle(Bundle bundle) {
        if (bundle == null) return;
        ArrayList<String> matches = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches != null) {
            for (String phrase : matches) {
                if (phrase == null) continue;
                String normalized = phrase.trim().toLowerCase();
                for (String wakeWord : activeWakeWords) {
                    if (normalized.contains(wakeWord)) {
                        triggerWakeEvent(wakeWord, phrase);
                        return;
                    }
                }
            }
        }
    }

    private void restartListeningWithBackoff(long delayMs) {
        if (!shouldContinueListening) return;
        mainHandler.postDelayed(() -> {
            if (shouldContinueListening && !isListening) {
                try {
                    if (speechRecognizer != null && recognizerIntent != null) {
                        speechRecognizer.startListening(recognizerIntent);
                        isListening = true;
                    } else {
                        initAndStartSpeechRecognition();
                    }
                } catch (Exception e) {
                    initAndStartSpeechRecognition();
                }
            }
        }, delayMs);
    }

    /**
     * Called when the wake word is detected while phone is in background or screen-off
     */
    public void triggerWakeEvent(String detectedWord, String fullPhrase) {
        // 1. Tactile haptic pulse
        try {
            Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 100, 60, 150}, -1));
                } else {
                    vibrator.vibrate(200);
                }
            }
        } catch (Exception ignored) {}

        // 2. Wake screen up (turn display on)
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock screenLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "oneva:JARVIS_TurnScreenOn"
                );
                screenLock.acquire(4000);
            }
        } catch (Exception ignored) {}

        // 3. Launch or bring MainActivity to front over lock screen
        try {
            Intent activityIntent = new Intent(this, MainActivity.class);
            activityIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            activityIntent.putExtra("TRIGGER_VOICE_WAKE", true);
            activityIntent.putExtra("WAKE_WORD", detectedWord);
            activityIntent.putExtra("RAW_PHRASE", fullPhrase);
            startActivity(activityIntent);
        } catch (Exception ignored) {}

        // 4. Notify JavaScript runtime directly via MainActivity
        MainActivity.notifyBackgroundWakeWordDetected(detectedWord);
    }

    @Override
    public void onDestroy() {
        isServiceRunning = false;
        shouldContinueListening = false;
        instance = null;

        if (speechRecognizer != null) {
            try {
                speechRecognizer.stopListening();
                speechRecognizer.destroy();
            } catch (Exception ignored) {}
            speechRecognizer = null;
        }

        releaseCpuWakeLock();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
