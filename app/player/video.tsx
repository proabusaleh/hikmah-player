import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HikmahButton } from '@/components/common/HikmahButton';
import { VideoPlayerView } from '@/components/video/VideoPlayerView';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { formatTime } from '@/utils/formatters';

export default function VideoPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getResumePosition } = useContinueWatchingStore();

  const mediaId = (params.id as string) || 'v-1';
  const mediaTitle = (params.title as string) || 'Hikmah Video';
  const mediaSpeaker = (params.speaker as string) || 'Islamic Scholar';
  const mediaUrl =
    (params.url as string) || 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

  const resumeFromParam = params.resumePosition ? Number(params.resumePosition) : null;
  const savedResume = getResumePosition(mediaId);
  const resumePosition = useMemo(
    () => (resumeFromParam !== null && !Number.isNaN(resumeFromParam) ? resumeFromParam : savedResume),
    [resumeFromParam, savedResume]
  );

  const hasResume = resumePosition !== null && resumePosition > 5;
  const [showResumePrompt, setShowResumePrompt] = useState(hasResume);

  return (
    <View style={styles.container}>
      <VideoPlayerView
        title={mediaTitle}
        videoUrl={mediaUrl}
        initialTime={showResumePrompt && hasResume ? resumePosition : 0}
      />

      {showResumePrompt && hasResume && resumePosition !== null && (
        <View style={styles.resumeOverlay}>
          <View style={styles.resumeCard}>
            <Text style={styles.resumeTitle}>Continue Watching?</Text>
            <Text style={styles.resumeTime}>Resume from {formatTime(resumePosition)}</Text>
            <View style={styles.resumeActions}>
              <HikmahButton
                title="Resume"
                onPress={() => setShowResumePrompt(false)}
                variant="primary"
                size="md"
              />
              <HikmahButton
                title="Start Over"
                onPress={() => {
                  setShowResumePrompt(false);
                  router.setParams({ resumePosition: '0' });
                }}
                variant="outline"
                size="md"
              />
            </View>
          </View>
        </View>
      )}

      {!showResumePrompt && hasResume && (
        <View style={styles.resumeBadge}>
          <Text style={styles.resumeBadgeText}>Resume from {formatTime(resumePosition ?? 0)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  resumeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  resumeCard: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resumeTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  resumeTime: {
    ...Typography.body,
    color: Colors.secondary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  resumeBadge: {
    position: 'absolute',
    bottom: 92,
    left: Spacing.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    zIndex: 9,
  },
  resumeBadgeText: {
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
});
