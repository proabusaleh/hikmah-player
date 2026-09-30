import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { StorageService } from '@/services/storage/storageService';

const { height, width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [logoScale] = useState(() => new Animated.Value(0.6));
  const [logoFade] = useState(() => new Animated.Value(0));
  const [textSlide] = useState(() => new Animated.Value(24));
  const [textFade] = useState(() => new Animated.Value(0));
  const [shineX] = useState(() => new Animated.Value(-160));
  const [barX] = useState(() => new Animated.Value(-120));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 13,
        stiffness: 110,
      }),
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(textFade, {
        toValue: 1,
        duration: 600,
        delay: 450,
        useNativeDriver: true,
      }),
      Animated.timing(textSlide, {
        toValue: 0,
        duration: 600,
        delay: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Light sweep across the logo.
    Animated.timing(shineX, {
      toValue: width + 160,
      duration: 1300,
      delay: 700,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Indeterminate loading shimmer.
    Animated.loop(
      Animated.timing(barX, {
        toValue: 120,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();

    const timer = setTimeout(async () => {
      try {
        const hasSeenOnboarding = await StorageService.getItem<boolean>('@hikmah_onboarding_done');
        router.replace(hasSeenOnboarding ? '/(tabs)' : '/onboarding');
      } catch {
        router.replace('/(tabs)');
      }
    }, 2600);

    return () => clearTimeout(timer);
  }, [router, logoScale, logoFade, textSlide, textFade, shineX, barX]);

  return (
    <View style={styles.container}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.gridDot} />

      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoFade, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoFrame}>
          <Image
            source={require('@/assets/icons/icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.shine, { transform: [{ translateX: shineX }, { rotate: '18deg' }] }]}
          />
        </View>
      </Animated.View>

      <Animated.View
        style={[styles.brandBlock, { opacity: textFade, transform: [{ translateY: textSlide }] }]}
      >
        <Text style={styles.brandName}>HIKMAH</Text>
        <View style={styles.brandRule}>
          <View style={styles.ruleLine} />
          <Text style={styles.brandSub}>PLAYER</Text>
          <View style={styles.ruleLine} />
        </View>
        <Text style={styles.tagline}>Illuminate Your Knowledge</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.loadTrack}>
          <Animated.View style={[styles.loadFill, { transform: [{ translateX: barX }] }]} />
        </View>
        <Text style={styles.version}>v{Constants.expoConfig?.version ?? '1.1.0'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowTop: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    top: -120,
    alignSelf: 'center',
  },
  glowBottom: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    bottom: height * 0.08,
    left: -100,
  },
  gridDot: {
    ...StyleSheet.absoluteFill,
    opacity: 0.5,
    backgroundColor: 'transparent',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoFrame: {
    width: 168,
    height: 168,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 16,
    backgroundColor: '#0F172A',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  shine: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  brandName: {
    ...Typography.h1,
    fontSize: 44,
    letterSpacing: 8,
    color: Colors.text,
    marginLeft: 8,
  },
  brandRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  ruleLine: {
    width: 44,
    height: 1,
    backgroundColor: 'rgba(52, 211, 153, 0.5)',
  },
  brandSub: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 6,
    color: Colors.secondary,
    marginLeft: 6,
  },
  tagline: {
    ...Typography.body,
    color: Colors.muted,
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },
  footer: {
    position: 'absolute',
    bottom: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadTrack: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  loadFill: {
    width: 48,
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  version: {
    ...Typography.caption,
    color: Colors.dim,
  },
});
