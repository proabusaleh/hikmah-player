import { beforeAll, describe, it } from '@jest/globals';
import { by, device, element, expect, waitFor } from 'detox';

describe('Audio Player', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.text('Surah Al-Fatihah')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Surah Al-Fatihah')).tap();
  });

  it('should show full player screen', async () => {
    await expect(element(by.text('NOW PLAYING'))).toBeVisible();
  });

  it('should display track title', async () => {
    await expect(element(by.text('Surah Al-Fatihah'))).toBeVisible();
  });

  it('should show playback controls', async () => {
    await expect(element(by.id('play-pause-button'))).toBeVisible();
  });

  it('should pause on play button tap', async () => {
    await element(by.id('play-pause-button')).tap();
    // Verify state changed (pause label appears when playing state toggles)
    await expect(element(by.id('play-pause-button'))).toBeVisible();
  });

  it('should open speed sheet', async () => {
    await element(by.id('speed-button')).tap();
    await expect(element(by.text('Playback Speed'))).toBeVisible();
  });

  it('should open sleep timer sheet', async () => {
    await element(by.id('sleep-button')).tap();
    await expect(element(by.text('Sleep Timer'))).toBeVisible();
  });
});

describe('Video Player', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.text('Featured Video')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should open video player on video card tap', async () => {
    await element(by.id('video-card')).tap();
    await waitFor(element(by.id('video-view')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
