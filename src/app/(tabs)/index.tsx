import { useRouter } from 'expo-router';
import {
  DownloadCloud,
  Film,
  FolderSearch,
  Music,
  Search,
  Smartphone,
} from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AudioCard } from '@/components/cards/AudioCard';
import { VideoCard } from '@/components/cards/VideoCard';
import { DownloadButton } from '@/components/common/DownloadButton';
import { HikmahButton } from '@/components/common/HikmahButton';
import { HikmahCard } from '@/components/common/HikmahCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { LocalMediaItem } from '@/types/library';
import { MediaItem } from '@/types/media';

const toMediaItem = (m: LocalMediaItem): MediaItem => ({
  id: m.id,
  title: m.title,
  url: m.filePath,
  duration: m.duration,
  type: m.mediaType,
  addedAt: m.addedAt,
  thumbnailUrl: m.thumbnail,
});

const greetingFor = (hour: number): string => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function HomeScreen() {
  const router = useRouter();
  const { currentTrack, playMedia, status } = useAudioPlayback();
  const { setQueue } = usePlayerStore();
  const {
    allMedia,
    loadLibrary,
    getAudio,
    getVideos,
    toggleFavorite,
    importPhoneMedia,
    scanDevice,
    isImportingPhoneMedia,
    isScanning,
  } = useLibraryStore();
  const { downloadedItems, startDownload, isItemDownloaded } = useDownloadsStore();

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  // Real on-device library only — no demo/mock entries.
  const audios = getAudio();
  const videos = getVideos();
  const audioList: MediaItem[] = audios.map(toMediaItem);
  const recentAudios = audioList.slice(0, 5);
  const featuredVideo = videos.length > 0 ? toMediaItem(videos[0]) : null;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const openVideo = (item: MediaItem) => {
    router.push({
      pathname: '/player/video',
      params: { id: item.id, title: item.title, url: item.url },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Greeting ── */}
      <Text style={styles.greeting}>{`${greetingFor(new Date().getHours())} 👋`}</Text>
      <Text style={styles.dateLine}>
        {today}
        {allMedia.length > 0 ? ` • ${allMedia.length} items on this device` : ''}
      </Text>

      {/* ── Search Bar ── */}
      <TouchableOpacity
        style={styles.searchBarPreview}
        onPress={() => router.push('/search')}
        activeOpacity={0.7}
      >
        <Search size={18} color={Colors.dim} />
        <Text style={styles.searchPreviewText}>Search recitations, lectures, playlists...</Text>
      </TouchableOpacity>

      {allMedia.length === 0 ? (
        <HikmahCard variant="bordered" padding="lg" style={styles.emptyCard}>
          <FolderSearch size={44} color={Colors.dim} />
          <Text style={styles.emptyTitle}>No media yet</Text>
          <Text style={styles.emptySubtitle}>
            Import the audio and videos from your phone to start listening and watching.
          </Text>
          <View style={styles.emptyActions}>
            <HikmahButton
              title={isImportingPhoneMedia ? 'Importing...' : 'Import Phone Media'}
              onPress={() => void importPhoneMedia()}
              variant="primary"
              size="md"
              loading={isImportingPhoneMedia}
              icon={<Smartphone size={16} color={Colors.white} />}
            />
            <HikmahButton
              title={isScanning ? 'Scanning...' : 'Scan Device'}
              onPress={() => void scanDevice()}
              variant="outline"
              size="md"
              loading={isScanning}
            />
          </View>
        </HikmahCard>
      ) : (
        <>
          {/* ── Stats ── */}
          <View style={styles.statsRow}>
            <HikmahCard variant="bordered" padding="md" style={styles.statCard}>
              <Music size={20} color={Colors.secondary} />
              <Text style={styles.statNumber}>{audios.length}</Text>
              <Text style={styles.statLabel}>Audio</Text>
            </HikmahCard>
            <HikmahCard variant="bordered" padding="md" style={styles.statCard}>
              <Film size={20} color={Colors.info} />
              <Text style={styles.statNumber}>{videos.length}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </HikmahCard>
            <HikmahCard variant="bordered" padding="md" style={styles.statCard}>
              <DownloadCloud size={20} color={Colors.accent} />
              <Text style={styles.statNumber}>{downloadedItems.length}</Text>
              <Text style={styles.statLabel}>Offline</Text>
            </HikmahCard>
          </View>

          {/* ── Featured video ── */}
          {featuredVideo ? (
            <>
              <SectionHeader
                title="Featured Video"
                actionLabel="See All"
                onAction={() => router.navigate('/library')}
              />
              <VideoCard
                item={featuredVideo}
                onPress={() => openVideo(featuredVideo)}
                onDownload={() => void startDownload(featuredVideo)}
                isDownloaded={isItemDownloaded(featuredVideo.id)}
              />
              <View style={styles.sectionGap} />
            </>
          ) : null}

          {/* ── Recent audio ── */}
          {recentAudios.length > 0 ? (
            <>
              <SectionHeader
                title="Recently Added"
                subtitle={`${audios.length} tracks on this device`}
                actionLabel="See All"
                onAction={() => router.navigate('/library')}
              />
              {recentAudios.map((item, index) => (
                <AudioCard
                  key={item.id}
                  item={item}
                  index={index}
                  isPlaying={currentTrack?.id === item.id && status === 'playing'}
                  isFavorite={audios[index]?.favorite ?? false}
                  onPress={() => {
                    setQueue(audioList, index);
                    playMedia(item);
                  }}
                  onFavorite={() => void toggleFavorite(item.id)}
                  rightAction={<DownloadButton item={item} />}
                />
              ))}
            </>
          ) : null}
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  greeting: {
    ...Typography.h1,
    fontSize: 26,
  },
  dateLine: {
    ...Typography.bodySmall,
    color: Colors.muted,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  searchBarPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  searchPreviewText: {
    fontSize: 14,
    color: Colors.dim,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    ...Typography.h2,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.muted,
  },
  sectionGap: {
    height: Spacing.xxl,
  },
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyActions: {
    width: '100%',
    gap: Spacing.md,
  },
});
