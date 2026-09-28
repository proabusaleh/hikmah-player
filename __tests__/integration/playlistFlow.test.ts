import { PlaylistManager } from '@/services/storage/playlistManager';
import { PlaylistFormData } from '@/types/playlist';

describe('Playlist Flow Integration', () => {
  const formData: PlaylistFormData = {
    name: 'Test Playlist',
    description: 'A test playlist',
    coverColor: '#10B981',
    coverEmoji: '🎵',
  };

  it('should create a playlist', async () => {
    const playlist = await PlaylistManager.createPlaylist(formData);

    expect(playlist.id).toBeDefined();
    expect(playlist.name).toBe('Test Playlist');
    expect(playlist.mediaIds).toHaveLength(0);
  });

  it('should add media to playlist', async () => {
    const playlist = await PlaylistManager.createPlaylist(formData);
    const count = await PlaylistManager.addMediaToPlaylist(playlist.id, ['m1', 'm2']);

    expect(count).toBe(2);
  });

  it('should not add duplicate media', async () => {
    const playlist = await PlaylistManager.createPlaylist(formData);
    await PlaylistManager.addMediaToPlaylist(playlist.id, ['m1']);
    const count = await PlaylistManager.addMediaToPlaylist(playlist.id, ['m1', 'm2']);

    expect(count).toBe(1); // Only m2 is new
  });

  it('should reorder media', async () => {
    const playlist = await PlaylistManager.createPlaylist(formData);
    await PlaylistManager.addMediaToPlaylist(playlist.id, ['m1', 'm2', 'm3']);
    await PlaylistManager.reorderMedia(playlist.id, 0, 2);

    const updated = await PlaylistManager.getPlaylistById(playlist.id);
    expect(updated?.mediaIds[2]).toBe('m1');
  });

  it('should delete playlist', async () => {
    const playlist = await PlaylistManager.createPlaylist(formData);
    await PlaylistManager.deletePlaylist(playlist.id);

    const deleted = await PlaylistManager.getPlaylistById(playlist.id);
    expect(deleted).toBeNull();
  });

  it('should reject empty playlist name', async () => {
    await expect(
      PlaylistManager.createPlaylist({ ...formData, name: '' })
    ).rejects.toThrow();
  });
});
