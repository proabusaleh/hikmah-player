import { useRouter } from 'expo-router';
import {
  DownloadCloud,
  Film,
  FolderSearch,
  History,
  Music,
  Play,
  Search,
  Smartphone,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
import { formatTime } from '@/utils/formatters';

type HomeTab = 'audio' | 'video' | 'recent';

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

const RecentTile: React.FC<{ item: LocalMediaItem; onPress: () => void }> = ({
  item,
  onPress,
}) => {
  const isVideo = item.mediaType === 'video';
  return (
    <TouchableOpacity style={styles.recentTile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.recentThumb}>
        {isVideo && item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.recentImage} />
        ) : (
          <View style={styles.recentFallback}>
            {isVideo ? (
              <Film size={26} color={Colors.info} />
            ) : (
              <Music size={26} color={Colors.secondary} />
            )}
          </View>
        )}
        <View style={styles.recentPlayOverlay}>
          <Play size={14} color={Colors.white} fill={Colors.white} />
        </View>
        <View style={styles.recentDuration}>
          <Text style={styles.recentDurationText}>{formatTime(item.duration)}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.recentTitle}>
        {item.title}
      </Text>
      <Text style={styles.recentMeta}>{isVideo ? 'Video' : 'Audio'}</Text>
    </TouchableOpacity>
  );
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
    getRecentlyPlayed,
    toggleFavorite,
    importPhoneMedia,
    scanDevice,
    isImportingPhoneMedia,
    isScanning,
  } = useLibraryStore();
  const { downloadedItems, startDownload, isItemDownloaded } = useDownloadsStore();
  const [activeTab, setActiveTab] = useState<HomeTab>('audio');

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  // Real on-device library only — no demo/mock entries.
  const audios = getAudio();
  const videos = getVideos();
  const recentFiles = getRecentlyPlayed();
  const audioList: MediaItem[] = audios.map(toMediaItem);
  const recentAudios = audioList.slice(0, 5);

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

  const playRecent = (m: LocalMediaItem) => {
    if (m.mediaType === 'video') {
      openVideo(toMediaItem(m));
      return;
    }
    const index = audioList.findIndex((a) => a.id === m.id);
    const at = index >= 0 ? index : 0;
    const track = audioList[at] ?? toMediaItem(m);
    setQueue(audioList.length > 0 ? audioList : [track], audioList.length > 0 ? at : 0);
    playMedia(track);
  };

  const tabs: { key: HomeTab; label: string; Icon: LucideIcon }[] = [
    { key: 'audio', label: 'Audio', Icon: Music },
    { key: 'video', label: 'Video', Icon: Film },
    { key: 'recent', label: 'Recent', Icon: History },
  ];

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

          {/* ── Media tabs ── */}
          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const TabIcon = tab.Icon;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <TabIcon size={16} color={isActive ? Colors.secondary : Colors.muted} />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === 'audio' ? (
            <>
              <SectionHeader
                title="Recently Added"
                subtitle={`${audios.length} tracks on this device`}
                actionLabel="See All"
                onAction={() => router.navigate('/library')}
              />
              {recentAudios.length === 0 ? (
                <Text style={styles.tabEmpty}>No audio on this device yet.</Text>
              ) : (
                recentAudios.map((item, index) => (
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
                ))
              )}
            </>
          ) : null}

          {activeTab === 'video' ? (
            <>
              <SectionHeader
                title="Videos"
                subtitle={`${videos.length} videos on this device`}
                actionLabel="See All"
                onAction={() => router.navigate('/library')}
              />
              {videos.length === 0 ? (
                <Text style={styles.tabEmpty}>No videos on this device yet.</Text>
              ) : (
                <View style={styles.videoGrid}>
                  {videos.slice(0, 6).map((m) => {
                    const item = toMediaItem(m);
                    return (
                      <VideoCard
                        key={m.id}
                        item={item}
                        variant="grid"
                        onPress={() => openVideo(item)}
                        onDownload={() => void startDownload(item)}
                        isDownloaded={isItemDownloaded(item.id)}
                      />
                    );
                  })}
                </View>
              )}
            </>
          ) : null}

          {activeTab === 'recent' ? (
            <>
              <SectionHeader
                title="Recent Files"
                subtitle="Jump back in where you left off"
                actionLabel="See All"
                onAction={() => router.navigate('/library')}
              />
              {recentFiles.length === 0 ? (
                <Text style={styles.tabEmpty}>Nothing played yet — your history shows up here.</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentRow}
                >
                  {recentFiles.slice(0, 10).map((m) => (
                    <RecentTile key={m.id} item={m} onPress={() => playRecent(m)} />
                  ))}
                </ScrollView>
              )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.surface,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  tabLabelActive: {
    color: Colors.text,
  },
  tabEmpty: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recentRow: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  recentTile: {
    width: 150,
  },
  recentThumb: {
    width: 150,
    height: 92,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  recentFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  recentPlayOverlay: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentDuration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  recentDurationText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  recentMeta: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
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
