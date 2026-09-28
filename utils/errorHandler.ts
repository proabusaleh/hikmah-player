import { Alert, ErrorUtils } from 'react-native';

// ─── Global Error Handler ────────────────────────────
export const setupGlobalErrorHandler = (): void => {
  // Catch unhandled JS errors
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
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
