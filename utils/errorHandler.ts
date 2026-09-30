import { Alert, Platform } from 'react-native';

// ─── Global Error Handler ────────────────────────────
// NOTE: `ErrorUtils` is a React Native *native-runtime* global. It does not
// exist on web (react-native-web), where importing it yields `undefined` and
// accessing `.getGlobalHandler()` throws. So we resolve it at runtime via
// `globalThis` and no-op when absent, with a `window.onerror` fallback on web.
type GlobalHandler = (error: Error, isFatal?: boolean) => void;

interface ErrorUtilsLike {
  getGlobalHandler: () => GlobalHandler;
  setGlobalHandler: (handler: GlobalHandler) => void;
}

const getErrorUtils = (): ErrorUtilsLike | undefined => {
  try {
    const candidate = (globalThis as Record<string, unknown>).ErrorUtils as
      | ErrorUtilsLike
      | undefined;
    if (
      candidate &&
      typeof candidate.getGlobalHandler === 'function' &&
      typeof candidate.setGlobalHandler === 'function'
    ) {
      return candidate;
    }
  } catch {
    // ignore — error-handler setup must never throw
  }
  return undefined;
};

const logGlobalError = (error: Error, isFatal?: boolean): void => {
  console.error('[GlobalError]', {
    message: error.message,
    stack: error.stack?.slice(0, 300),
    isFatal,
    timestamp: Date.now(),
  });

  // In production, send to crash reporting
  if (!__DEV__) {
    // Sentry.captureException(error);
    // firebase.crashlytics().recordError(error);
  }
};

export const setupGlobalErrorHandler = (): void => {
  try {
    // ── Web: no ErrorUtils — use DOM handlers instead ──
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
          const reason = event.reason;
          logGlobalError(
            reason instanceof Error ? reason : new Error(String(reason)),
            false
          );
        });
      }
      return;
    }

    // ── Native: hook ErrorUtils when available ──
    const errorUtils = getErrorUtils();
    if (!errorUtils) return;

    // Catch unhandled JS errors
    const originalHandler = errorUtils.getGlobalHandler();

    errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      logGlobalError(error, isFatal);

      // Show user-friendly alert for fatal errors (production only —
      // the redbox already covers this in dev, and the app is restarting).
      if (isFatal && !__DEV__) {
        Alert.alert('App Error', 'An unexpected error occurred. The app will try to recover.', [
          { text: 'OK' },
        ]);
      }

      // Call original handler (required: it rethrows / reloads)
      originalHandler(error, isFatal);
    });
  } catch {
    // Never let error-handler setup crash the app.
  }
};

// ─── Network Error Handler ───────────────────────────
export const handleNetworkError = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('Network request failed')) {
      return 'No internet connection. Please check your network.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message || 'An unknown error occurred.';
  }
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 404) return 'Content not found.';
    if (status !== undefined && status >= 500) return 'Server error. Please try again later.';
  }
  return 'An unknown error occurred.';
};

// ─── Safe Async Wrapper ──────────────────────────────
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[SafeAsync] ${errorMessage || 'Error'}:`, message);
    return fallback;
  }
};
