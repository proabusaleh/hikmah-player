import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { StorageService } from '@/services/storage/storageService';

const { height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [scaleAnim] = useState(() => new Animated.Value(0.5));
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [subtitleFade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 100,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(subtitleFade, {
      toValue: 1,
      duration: 600,
      delay: 600,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(async () => {
      try {
        const hasSeenOnboarding = await StorageService.getItem<boolean>('@hikmah_onboarding_done');
        router.replace(hasSeenOnboarding ? '/(tabs)' : '/onboarding');
      } catch {
        router.replace('/(tabs)');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [router, scaleAnim, fadeAnim, subtitleFade]);

  return (
    <View style={styles.container}>
      <View style={styles.glowCircle1} />
      <View style={styles.glowCircle2} />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>▶</Text>
        </View>
        <Text style={styles.brandName}>Hikmah</Text>
        <Text style={styles.brandSub}>Player</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: subtitleFade }]}>
        Illuminate Your Knowledge
      </Animated.Text>

      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: height * 0.15,
    left: -80,
  },
  glowCircle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    bottom: height * 0.2,
    right: -60,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 36,
    color: Colors.white,
    marginLeft: 4,
  },
  brandName: {
    ...Typography.h1,
    fontSize: 38,
    color: Colors.text,
    letterSpacing: 1,
  },
  brandSub: {
    ...Typography.h3,
    color: Colors.secondary,
    marginTop: -4,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  tagline: {
    ...Typography.body,
    color: Colors.muted,
    marginTop: Spacing.xxl,
    fontStyle: 'italic',
  },
  version: {
    ...Typography.caption,
    position: 'absolute',
    bottom: Spacing.xxxl,
  },
});
