import { router } from 'expo-router';
import { AlertTriangle, Bug, Home, RefreshCw } from 'lucide-react-native';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  screenName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to error tracking service
    this.logError(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo): void {
    const errorReport = {
      id: this.state.errorId,
      screen: this.props.screenName || 'Unknown',
      message: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: errorInfo.componentStack?.slice(0, 500),
      timestamp: new Date().toISOString(),
      device: {
        platform: Platform.OS,
        version: Platform.Version,
      },
    };

    console.error('[ErrorBoundary] Crash Report:', JSON.stringify(errorReport, null, 2));

    // In production, send to Sentry/Firebase Crashlytics
    // Sentry.captureException(error, { extra: errorReport });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleGoHome = (): void => {
    this.handleReset();
    router.replace('/');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <AlertTriangle size={48} color={Colors.warning} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.subtitle}>
              We encountered an unexpected error. Your data is safe.
            </Text>

            {/* Error ID */}
            <View style={styles.errorIdBadge}>
              <Bug size={12} color={Colors.dim} />
              <Text style={styles.errorIdText}>Error ID: {this.state.errorId}</Text>
            </View>

            {/* Error Details (Dev Only) */}
            {__DEV__ && this.state.error && (
              <View style={styles.devDetails}>
                <Text style={styles.devLabel}>Error Message:</Text>
                <Text style={styles.devMessage}>{this.state.error.message}</Text>
                {this.state.error.stack && (
                  <>
                    <Text style={styles.devLabel}>Stack Trace:</Text>
                    <Text style={styles.devStack} numberOfLines={8}>
                      {this.state.error.stack}
                    </Text>
                  </>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <RefreshCw size={18} color={Colors.background} />
                <Text style={styles.primaryBtnText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={this.handleGoHome}
                activeOpacity={0.7}
              >
                <Home size={18} color={Colors.text} />
                <Text style={styles.secondaryBtnText}>Go Home</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.muted,
    marginBottom: Spacing.xl,
  },
  errorIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  errorIdText: {
    fontSize: 11,
    color: Colors.dim,
    fontFamily: 'monospace',
  },
  devDetails: {
    width: '100%',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginBottom: Spacing.xl,
  },
  devLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  devMessage: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  devStack: {
    fontSize: 10,
    color: Colors.muted,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.background,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
