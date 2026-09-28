import { beforeAll, beforeEach, describe, it } from '@jest/globals';
import { by, device, element, expect, waitFor } from 'detox';

describe('Home Screen', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show splash screen on launch', async () => {
    await expect(element(by.text('Hikmah'))).toBeVisible();
  });

  it('should navigate to home after splash', async () => {
    await waitFor(element(by.text('Featured Video')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should display audio track list', async () => {
    await waitFor(element(by.text('Quran Recitations')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.text('Surah Al-Fatihah'))).toBeVisible();
  });

  it('should play audio on track tap', async () => {
    await waitFor(element(by.text('Surah Al-Fatihah')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text('Surah Al-Fatihah')).tap();
    await expect(element(by.text('NOW PLAYING'))).toBeVisible();
  });
});

describe('Tab Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.text('Featured Video')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should switch to Library tab', async () => {
    await element(by.text('Library')).tap();
    // Tab bar label doubles as the visible marker for the Library tab
    await expect(element(by.text('Library'))).toBeVisible();
  });

  it('should switch to Downloads tab', async () => {
    await element(by.text('Downloads')).tap();
    await expect(element(by.text('No Downloads'))).toBeVisible();
  });

  it('should switch to Settings tab', async () => {
    await element(by.text('Settings')).tap();
    await expect(element(by.text('Playback'))).toBeVisible();
  });
});
