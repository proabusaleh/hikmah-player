import { useRouter } from 'expo-router';
import { Play, Video } from 'lucide-react-native';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { ContinueWatchingSection } from '@/components/common/ContinueWatchingSection';
import { DownloadButton } from '@/components/common/DownloadButton';
import { Colors } from '@/constants/colors';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { usePlayerStore } from '@/store/usePlayerStore';
import { MediaItem } from '@/types/media';

const DEMO_PLAYLIST: MediaItem[] = [
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

export default function HomeScreen() {
  const router = useRouter();
  const { playMedia } = useAudioPlayback();
  const { setQueue } = usePlayerStore();
  const { getResumeTime } = useProgressTracker();

  const handlePlayTrack = (track: MediaItem, index: number) => {
    setQueue(DEMO_PLAYLIST, index);
    playMedia(track);
  };

  const handleContinueWatchingPress = (item: { mediaId: string; title: string; mediaType: 'audio' | 'video'; sourceUrl: string; position: number; speakerOrArtist?: string }) => {
    if (item.mediaType === 'video') {
      router.push({
        pathname: '/player/video',
        params: {
          id: item.mediaId,
          title: item.title,
          speaker: item.speakerOrArtist,
          url: item.sourceUrl,
          resumePosition: String(item.position),
        },
      });
      return;
    }

    router.push({
      pathname: '/player',
      params: {
        mediaId: item.mediaId,
        resumePosition: String(item.position),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ContinueWatchingSection
        variant="horizontal"
        maxItems={8}
        onItemPress={handleContinueWatchingPress}
      />

      <Text style={styles.headerTitle}>Featured Recitations</Text>

      <FlatList
        data={DEMO_PLAYLIST}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handlePlayTrack(item, index)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Play size={18} color={Colors.dark.primary} fill={Colors.dark.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.trackTitle}>{item.title}</Text>
              <Text style={styles.trackArtist}>{item.artistOrSpeaker}</Text>
            </View>
            <DownloadButton item={item} />
          </TouchableOpacity>
        )}
      />

      <Text style={[styles.headerTitle, styles.sectionSpacer]}>Featured Videos</Text>

      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => router.push('/player/video')}
        activeOpacity={0.8}
      >
        <View style={styles.videoIconCircle}>
          <Video size={20} color={Colors.dark.primary} fill={Colors.dark.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.trackTitle}>Hikmah Lecture — The Beauty of Patience</Text>
          <Text style={styles.trackArtist}>A short reflection on resilience and gratitude.</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  sectionSpacer: {
    marginTop: 20,
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  trackArtist: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
});
