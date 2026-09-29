import { useRouter } from 'expo-router';
import { Download, Music, PlayCircle } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { HikmahButton } from '@/components/common/HikmahButton';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { StorageService } from '@/services/storage/storageService';

const { width } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const PAGES: OnboardingPage[] = [
  {
    id: '1',
    icon: <PlayCircle size={80} color={Colors.secondary} />,
    title: 'Audio & Video Player',
    description:
      'Enjoy seamless playback of Quran recitations, lectures, and Islamic content with custom controls.',
  },
  {
    id: '2',
    icon: <Download size={80} color={Colors.accent} />,
    title: 'Offline Downloads',
    description:
      'Save your favorite recitations and lectures for offline listening — no internet required.',
  },
  {
    id: '3',
    icon: <Music size={80} color={Colors.info} />,
    title: 'Your Personal Library',
    description:
      'Organize playlists, bookmark favorites, and track your listening history all in one place.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const listRef = useRef<FlatList>(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
      },
    },
  );

  const completeOnboarding = async () => {
    await StorageService.setItem('@hikmah_onboarding_done', true);
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (activeIndex < PAGES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      void completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  return (
    <View style={styles.container}>
      {activeIndex < PAGES.length - 1 && (
        <HikmahButton title="Skip" onPress={handleSkip} variant="ghost" size="sm" style={styles.skipButton} />
      )}

      <FlatList
        ref={listRef}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={styles.iconContainer}>{item.icon}</View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.dotsContainer}>
        {PAGES.map((_, index) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
            />
          );
        })}
      </View>

      <View style={styles.buttonContainer}>
        <HikmahButton
          title={activeIndex === PAGES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: Spacing.xxxl + 16,
    right: Spacing.xl,
    zIndex: 10,
  },
  page: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.huge,
  },
});
