import { DownloadService } from '@/services/storage/downloadService';
import { MediaItem } from '@/types/media';

const mockItem: MediaItem = {
  id: 'dl-1',
  title: 'Test Download',
  url: 'https://example.com/test.mp3',
  duration: 120,
  type: 'audio',
  addedAt: Date.now(),
};

describe('Download Flow Integration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should download file and return local item', async () => {
    const result = await DownloadService.downloadFile(mockItem);

    expect(result.isLocal).toBe(true);
    expect(result.url).toContain('file:///');
    expect(result.id).toBe(mockItem.id);
    expect(result.title).toBe(mockItem.title);
  });

  it('should report progress during download', async () => {
    const progressCallback = jest.fn();
    // Mock a progress-emitting resumable for this test
    const FileSystem = jest.requireMock('expo-file-system/legacy') as {
      createDownloadResumable: jest.Mock;
    };
    FileSystem.createDownloadResumable.mockImplementationOnce(
      (_url: string, _path: string, _opts: unknown, onProgress: (p: object) => void) => {
        onProgress({ totalBytesWritten: 50, totalBytesExpectedToWrite: 100 });
        return {
          downloadAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock/progress.mp3' }),
          pauseAsync: jest.fn(),
        };
      }
    );

    await DownloadService.downloadFile(mockItem, progressCallback);

    expect(progressCallback).toHaveBeenCalledWith(0.5);
  });

  it('should persist file size metadata', async () => {
    const result = await DownloadService.downloadFile(mockItem);

    expect(result.sizeInBytes).toBeDefined();
    expect(typeof result.sizeInBytes).toBe('number');
  });

  it('should throw when download returns no URI', async () => {
    const FileSystem = jest.requireMock('expo-file-system/legacy') as {
      createDownloadResumable: jest.Mock;
    };
    FileSystem.createDownloadResumable.mockImplementationOnce(() => ({
      downloadAsync: jest.fn().mockResolvedValue(undefined),
      pauseAsync: jest.fn(),
    }));

    await expect(DownloadService.downloadFile(mockItem)).rejects.toThrow(
      'Download failed: No URI returned'
    );
  });
});
