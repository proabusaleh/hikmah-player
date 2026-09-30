import { useRouter } from 'expo-router';
import {
    ChevronRight,
    Clock,
    DownloadCloud,
    Film,
    FolderSearch,
    Heart,
    ListMusic,
    Music,
    Play,
    Search,
    Smartphone,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { HikmahButton } from '@/components/common/HikmahButton';
import { HikmahCard } from '@/components/common/HikmahCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { OptimizedMediaList } from '@/components/optimized/OptimizedMediaList';
import { AddToPlaylistSheet } from '@/components/playlist/AddToPlaylistSheet';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useSearchStore } from '@/store/useSearchStore';
import { LibrarySection, LocalMediaItem } from '@/types/library';
import { MediaItem } from '@/types/media';
import { formatTime } from '@/utils/formatters';

const SECTIONS: {
  key: LibrarySection;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: 'all', label: 'All Media', icon: <FolderSearch size={18} />, color: Colors.text },
  { key: 'videos', label: 'Videos', icon: <Film size={18} />, color: Colors.info },
  { key: 'audio', label: 'Audio', icon: <Music size={18} />, color: Colors.secondary },
  { key: 'favorites', label: 'Favorites', icon: <Heart size={18} />, color: Colors.danger },
  { key: 'recentlyPlayed', label: 'Recent', icon: <Clock size={18} />, color: Colors.warning },
  { key: 'downloads', label: 'Downloads', icon: <DownloadCloud size={18} />, color: Colors.accent },
];

export default function LibraryScreen() {
  const router = useRouter();
  const {
    activeSection,
    isLoading,
    isScanning,
    lastScanResult,
    playlists,
    searchQuery,
    isImportingPhoneMedia,
    phoneMediaResult,
    loadLibrary,
    scanDevice,
    importPhoneMedia,
    refreshPhoneMediaPermission,
    setActiveSection,
    setSearchQuery,
    getFilteredMedia,
    getRecentlyPlayed,
    getFavorites,
    toggleFavorite,
    createPlaylist,
  } = useLibraryStore();

  const { playMedia, setQueue, currentTrack, status } = useAudioPlayback();
  const { startDownload } = useDownloadsStore();
  const [showSearch, setShowSearch] = useState(false);
  const [addToPlaylistMedia, setAddToPlaylistMedia] = useState<LocalMediaItem | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // `Linking.openSettings()` only exists on native (iOS/Android). On web it
  // is undefined, so guard it and explain where browser permissions live.
  const openSystemSettings = (): void => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'System Settings',
        'Media permissions are managed in your browser\u2019s site settings (lock icon in the address bar).'
      );
      return;
    }
    void Linking.openSettings();
  };

  useEffect(() => {
    void loadLibrary();
    // Check (without prompting) whether the phone-media permission is already granted.
    void refreshPhoneMediaPermission();
  }, [loadLibrary, refreshPhoneMediaPermission]);

  const handleImportPhoneMedia = async () => {
    const status = await importPhoneMedia();

    if (status === 'imported') {
      // Keep Universal Search in sync with the newly imported files.
      const searchStore = useSearchStore.getState();
      if (searchStore.isIndexReady) {
        searchStore.buildSearchIndex();
      }
    } else if (status === 'denied') {
      Alert.alert(
        'Permission Needed',
        'Hikmah Player needs access to your videos and audio to import them. Open Settings to allow access.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSystemSettings() },
        ]
      );
    } else {
      Alert.alert(
        'Import Unavailable',
        'Could not read media from this device. Try the Scan Device option instead.'
      );
    }
  };

  const filteredMedia = getFilteredMedia();
  const recentItems = getRecentlyPlayed();
  const favoriteItems = getFavorites();

  const handlePlayAudio = (item: LocalMediaItem, list: LocalMediaItem[]) => {
    const index = list.findIndex((m) => m.id === item.id);
    setQueue(
      list.map((m) => ({
        id: m.id,
        title: m.title,
        url: m.filePath,
        duration: m.duration,
        type: m.mediaType,
        addedAt: m.addedAt,
      })),
      index >= 0 ? index : 0
    );
    playMedia({
      id: item.id,
      title: item.title,
      url: item.filePath,
      duration: item.duration,
      type: item.mediaType,
      addedAt: item.addedAt,
    });
  };

  const handlePlayVideo = (item: LocalMediaItem) => {
    router.push({
      pathname: '/player/video',
      params: {
        id: item.id,
        title: item.title,
        url: item.filePath,
      },
    });
  };

  const toMediaItem = (m: LocalMediaItem): MediaItem => ({
    id: m.id,
    title: m.title,
    url: m.filePath,
    duration: m.duration,
    type: m.mediaType,
    addedAt: m.addedAt,
    thumbnailUrl: m.thumbnail,
  });

  const handleOptimizedPlay = (item: LocalMediaItem, list: LocalMediaItem[]) => {
    if (item.mediaType === 'video') {
      handlePlayVideo(item);
    } else {
      handlePlayAudio(item, list);
    }
  };

  const handleOptimizedDownload = (item: LocalMediaItem) => {
    void startDownload(toMediaItem(item));
  };

  // `Alert.prompt` is iOS-only — use a BottomSheet dialog so playlist
  // creation works on Android and web too.
  const handleCreatePlaylist = () => {
    setNewPlaylistName('');
    setShowCreatePlaylist(true);
  };

  const handleConfirmCreatePlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    setShowCreatePlaylist(false);
    setNewPlaylistName('');
    void createPlaylist(name);
  };

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Loading Library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {showSearch ? (
          <View style={styles.searchInputWrap}>
            <View style={styles.searchIcon}>
              <Search size={18} color={Colors.muted} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search library..."
              placeholderTextColor={Colors.dim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.searchBar} onPress={() => setShowSearch(true)}>
            <Search size={18} color={Colors.dim} />
            <Text style={styles.searchPlaceholder}>Search library...</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionScroll} contentContainerStyle={styles.sectionChips}>
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.key;
          return (
            <TouchableOpacity
              key={section.key}
              style={[styles.sectionChip, isActive && styles.sectionChipActive]}
              onPress={() => setActiveSection(section.key)}
              activeOpacity={0.7}
            >
              {section.icon}
              <Text style={[styles.sectionChipText, isActive && styles.sectionChipTextActive]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeSection === 'all' && !searchQuery && (
        <View style={styles.statsRow}>
          <HikmahCard variant="bordered" padding="md" style={styles.statCard}>
            <Music size={20} color={Colors.secondary} />
            <Text style={styles.statNumber}>{useLibraryStore.getState().getAudio().length}</Text>
            <Text style={styles.statLabel}>Audio</Text>
          </HikmahCard>
          <HikmahCard variant="bordered" padding="md" style={styles.statCard}>
            <Film size={20} color={Colors.info} />
            <Text style={styles.statNumber}>{useLibraryStore.getState().getVideos().length}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </HikmahCard>
          <HikmahCard variant="bordered" padding="md" style={styles.statCard}>
            <Heart size={20} color={Colors.danger} />
            <Text style={styles.statNumber}>{favoriteItems.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </HikmahCard>
          <HikmahCard variant="bordered" padding="md" style={styles.statCard}>
            <ListMusic size={20} color={Colors.accent} />
            <Text style={styles.statNumber}>{playlists.length}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </HikmahCard>
        </View>
      )}

      {activeSection === 'all' && !searchQuery && recentItems.length > 0 && (
        <View style={styles.recentSection}>
          <SectionHeader title="Recently Played" actionLabel="See All" onAction={() => setActiveSection('recentlyPlayed')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
            {recentItems.slice(0, 8).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentCard}
                onPress={() =>
                  item.mediaType === 'audio'
                    ? handlePlayAudio(item, recentItems)
                    : handlePlayVideo(item)
                }
                activeOpacity={0.7}
              >
                <View style={styles.recentThumb}>
                  {item.mediaType === 'video' ? (
                    <Film size={20} color={Colors.info} />
                  ) : (
                    <Music size={20} color={Colors.secondary} />
                  )}
                  <View style={styles.recentPlayOverlay}>
                    <Play size={14} color={Colors.white} fill={Colors.white} />
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.recentTitle}>{item.title}</Text>
                <Text style={styles.recentMeta}>{formatTime(item.duration)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {activeSection === 'all' && !searchQuery && (
        <View style={styles.playlistSection}>
          <SectionHeader title="Playlists" actionLabel="New" onAction={handleCreatePlaylist} />
          {playlists.length === 0 ? (
            <HikmahCard variant="bordered" padding="lg" style={styles.emptyPlaylist}>
              <ListMusic size={32} color={Colors.dim} />
              <Text style={styles.emptyPlaylistText}>No playlists yet</Text>
              <HikmahButton
                title="Create Playlist"
                onPress={handleCreatePlaylist}
                variant="outline"
                size="sm"
              />
            </HikmahCard>
          ) : (
            playlists.slice(0, 3).map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistRow}
                onPress={() =>
                  router.push({
                    pathname: '/library/playlist',
                    params: { playlistId: playlist.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.playlistIcon}>
                  <ListMusic size={20} color={Colors.accent} />
                </View>
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName}>{playlist.name}</Text>
                  <Text style={styles.playlistCount}>{playlist.mediaIds.length} items</Text>
                </View>
                <ChevronRight size={18} color={Colors.dim} />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {(activeSection !== 'all' || searchQuery !== '') && (
        <OptimizedMediaList
          data={filteredMedia}
          onPlay={(item) => handleOptimizedPlay(item, filteredMedia)}
          onFavorite={(id) => void toggleFavorite(id)}
          onDownload={handleOptimizedDownload}
          onLongPress={(item) => setAddToPlaylistMedia(item)}
          currentPlayingId={status === 'playing' ? currentTrack?.id : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FolderSearch size={48} color={Colors.dim} />
              <Text style={styles.emptyTitle}>No Media Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : 'Scan your device to find media files'}
              </Text>
              {!searchQuery && (
                <View style={styles.emptyActions}>
                  <HikmahButton
                    title={isScanning ? 'Scanning...' : 'Scan Device'}
                    onPress={() => void scanDevice()}
                    variant="primary"
                    size="md"
                    loading={isScanning}
                    icon={<FolderSearch size={16} color={Colors.white} />}
                  />
                  <HikmahButton
                    title={isImportingPhoneMedia ? 'Importing...' : 'Import Phone Media'}
                    onPress={() => void handleImportPhoneMedia()}
                    variant="outline"
                    size="md"
                    loading={isImportingPhoneMedia}
                    icon={<Smartphone size={16} color={Colors.secondary} />}
                  />
                </View>
              )}
            </View>
          }
        />
      )}

      {activeSection === 'all' && !searchQuery && (
        <View style={styles.fabStack}>
          <TouchableOpacity
            style={styles.importFab}
            onPress={() => void handleImportPhoneMedia()}
            activeOpacity={0.8}
            disabled={isImportingPhoneMedia}
          >
            {isImportingPhoneMedia ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Smartphone size={22} color={Colors.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scanFab}
            onPress={() => void scanDevice()}
            activeOpacity={0.8}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <FolderSearch size={22} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {lastScanResult && (
        <View style={styles.scanToast}>
          <Text style={styles.scanToastText}>
            ✅ Scan complete: {lastScanResult.added} new files found ({lastScanResult.total} total)
          </Text>
        </View>
      )}

      {phoneMediaResult && (
        <View style={styles.scanToast}>
          <Text style={styles.scanToastText}>
            📱 Imported {phoneMediaResult.added} phone files ({phoneMediaResult.total} total in library)
          </Text>
        </View>
      )}

      {addToPlaylistMedia && (
        <AddToPlaylistSheet
          visible={!!addToPlaylistMedia}
          onClose={() => setAddToPlaylistMedia(null)}
          mediaId={addToPlaylistMedia.id}
          mediaTitle={addToPlaylistMedia.title}
          onAdded={() => {
            setAddToPlaylistMedia(null);
          }}
        />
      )}

      <BottomSheet
        visible={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        title="New Playlist"
        snapHeight={0.35}
      >
        <TextInput
          style={styles.playlistNameInput}
          placeholder="Enter playlist name..."
          placeholderTextColor={Colors.dim}
          value={newPlaylistName}
          onChangeText={setNewPlaylistName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleConfirmCreatePlaylist}
        />
        <View style={styles.playlistDialogActions}>
          <HikmahButton
            title="Cancel"
            onPress={() => setShowCreatePlaylist(false)}
            variant="outline"
            size="md"
          />
          <HikmahButton
            title="Create"
            onPress={handleConfirmCreatePlaylist}
            variant="primary"
            size="md"
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.muted,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.dim,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.secondary,
    gap: Spacing.sm,
  },
  searchIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
  },
  playlistNameInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  playlistDialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  sectionScroll: {
    maxHeight: 50,
  },
  sectionChips: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  sectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  sectionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  sectionChipTextActive: {
    color: Colors.background,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    ...Typography.h3,
    fontSize: 18,
    marginTop: 4,
  },
  statLabel: {
    ...Typography.caption,
  },
  recentSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  recentScroll: {
    gap: Spacing.md,
  },
  recentCard: {
    width: 100,
    alignItems: 'center',
  },
  recentThumb: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 6,
  },
  recentPlayOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    width: '100%',
  },
  recentMeta: {
    fontSize: 11,
    color: Colors.dim,
  },
  playlistSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  emptyPlaylist: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyPlaylistText: {
    ...Typography.body,
    color: Colors.dim,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  playlistIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    ...Typography.h4,
    fontSize: 15,
  },
  playlistCount: {
    ...Typography.bodySmall,
    fontSize: 12,
  },
  mediaList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  scanFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabStack: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  importFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyActions: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  scanToast: {
    position: 'absolute',
    bottom: 150,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  scanToastText: {
    ...Typography.bodySmall,
    color: Colors.text,
    textAlign: 'center',
  },
});
