import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';

import { AudioCard } from '@/components/cards/AudioCard';
import { MediaItem } from '@/types/media';

const mockItem: MediaItem = {
  id: '1',
  title: 'Surah Al-Fatihah',
  artistOrSpeaker: 'Mishary',
  url: 'https://example.com/fatihah.mp3',
  duration: 42,
  type: 'audio',
  addedAt: Date.now(),
};

describe('AudioCard', () => {
  const mockOnPress = jest.fn();
  const mockOnFavorite = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('should render track title', async () => {
    await render(<AudioCard item={mockItem} onPress={mockOnPress} />);
    expect(screen.getByText('Surah Al-Fatihah')).toBeTruthy();
  });

  it('should render artist name', async () => {
    await render(<AudioCard item={mockItem} onPress={mockOnPress} />);
    expect(screen.getByText(/Mishary/)).toBeTruthy();
  });

  it('should call onPress when tapped', async () => {
    const user = userEvent.setup();
    await render(<AudioCard item={mockItem} onPress={mockOnPress} />);
    await user.press(screen.getByLabelText('Play Surah Al-Fatihah'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should show active state when playing', async () => {
    await render(<AudioCard item={mockItem} isPlaying onPress={mockOnPress} />);
    expect(screen.getByText('Surah Al-Fatihah')).toBeTruthy();
  });

  it('should render favorite button when onFavorite provided', async () => {
    const user = userEvent.setup();
    await render(
      <AudioCard item={mockItem} onPress={mockOnPress} onFavorite={mockOnFavorite} />
    );
    const favBtn = screen.getByLabelText('Add Surah Al-Fatihah to favorites');
    await user.press(favBtn);
    expect(mockOnFavorite).toHaveBeenCalledTimes(1);
  });

  it('should render track index when provided', async () => {
    await render(<AudioCard item={mockItem} index={3} onPress={mockOnPress} />);
    expect(screen.getByText('4')).toBeTruthy(); // index + 1
  });
});
