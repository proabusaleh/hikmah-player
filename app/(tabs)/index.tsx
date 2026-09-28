import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AudioCard } from '@/components/cards/AudioCard';
import { VideoCard } from '@/components/cards/VideoCard';
import { DownloadButton } from '@/components/common/DownloadButton';
import { SectionHeader } from '@/components/common/SectionHeader';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useLibraryStore } from '@/store/useLibraryStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { MediaItem } from '@/types/media';

const AUDIO_PLAYLIST: MediaItem[] = [
  {
    id: '1',
    title: 'Surah Al-Fatihah',
    artistOrSpeaker: 'Mishary Rashid Alafasy',
    url: 'https://server8.mp3quran.net/afs/001.mp3',
    duration: 42,
    type: 'audio',
    addedAt: Date.now(),
  },
  {
    id: '2',
    title: 'Surah Al-Ikhlas',
    artistOrSpeaker: 'Mishary Rashid Alafasy',
    url: 'https://server8.mp3quran.net/afs/112.mp3',
    duration: 20,
    type: 'audio',
    addedAt: Date.now(),
  },
  {
    id: '3',
    title: 'Surah Al-Falaq',
    artistOrSpeaker: 'Mishary Rashid Alafasy',
    url: 'https://server8.mp3quran.net/afs/113.mp3',
    duration: 25,
    type: 'audio',
    addedAt: Date.now(),
  },
];

const VIDEO_ITEM: MediaItem = {
  id: 'v-1',
  title: 'Reflection on Quran & Life',
  artistOrSpeaker: 'Hikmah Production',
  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  duration: 596,
  type: 'video',
  addedAt: Date.now(),
};

export default function HomeScreen() {
  const router = useRouter();
  const { currentTrack, playMedia, status } = useAudioPlayback();
  const { setQueue } = usePlayerStore();
  const { allMedia, loadLibrary, getAudio, getVideos } = useLibraryStore();

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  // Real phone media first (Library → Import Phone Media), demo tracks as fallback.
  const libraryAudios: MediaItem[] = getAudio().map((m) => ({
    id: m.id,
    title: m.title,
    url: m.filePath,
    duration: m.duration,
    type: m.mediaType,
    addedAt: m.addedAt,
  }));
  const libraryVideos: MediaItem[] = getVideos().map((m) => ({
    id: m.id,
    title: m.title,
    url: m.filePath,
    duration: m.duration,
    type: m.mediaType,
    addedAt: m.addedAt,
    thumbnailUrl: m.thumbnail,
  }));

  const audioList = libraryAudios.length > 0 ? libraryAudios : AUDIO_PLAYLIST;
  const featuredVideo = libraryVideos.length > 0 ? libraryVideos[0] : VIDEO_ITEM;
  const audioSubtitle =
    libraryAudios.length > 0 ? `${allMedia.length} items on this device` : 'Mishary Rashid Alafasy';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Search Bar ── */}
      <TouchableOpacity
        style={styles.searchBarPreview}
        onPress={() => router.push('/search')}
        activeOpacity={0.7}
      >
        <Search size={18} color={Colors.dim} />
        <Text style={styles.searchPreviewText}>
          Search recitations, lectures, playlists...
        </Text>
      </TouchableOpacity>

      <SectionHeader title="Featured Video" actionLabel="See All" onAction={() => router.push('/(tabs)/library')} />
      <VideoCard
        item={featuredVideo}
        onPress={() =>
          router.push({
            pathname: '/player/video',
            params: {
              id: featuredVideo.id,
              title: featuredVideo.title,
              speaker: featuredVideo.artistOrSpeaker,
              url: featuredVideo.url,
            },
          })
        }
        onDownload={() => {}}
      />

      <View style={styles.sectionGap} />
      <SectionHeader
        title="Quran Recitations"
        subtitle={audioSubtitle}
        actionLabel="See All"
        onAction={() => router.push('/(tabs)/library')}
      />

      {audioList.map((item, index) => (
        <AudioCard
          key={item.id}
          item={item}
          index={index}
          isPlaying={currentTrack?.id === item.id && status === 'playing'}
          onPress={() => {
            setQueue(audioList, index);
            playMedia(item);
          }}
          onFavorite={() => {}}
          rightAction={<DownloadButton item={item} />}
        />
      ))}

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
  sectionGap: {
    height: Spacing.xxl,
  },
});
