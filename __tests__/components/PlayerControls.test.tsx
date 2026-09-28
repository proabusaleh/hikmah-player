import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';

import { PlayerControls } from '@/components/player/PlayerControls';

describe('PlayerControls', () => {
  const mockProps = {
    status: 'playing' as const,
    onTogglePlayPause: jest.fn(),
    onSkipNext: jest.fn(),
    onSkipPrevious: jest.fn(),
    onSeekRelative: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('should render play button with accessible label when paused', async () => {
    await render(<PlayerControls {...mockProps} status="paused" />);
    expect(screen.getByLabelText('Play')).toBeTruthy();
  });

  it('should render pause label when playing', async () => {
    await render(<PlayerControls {...mockProps} status="playing" />);
    expect(screen.getByLabelText('Pause')).toBeTruthy();
  });

  it('should call togglePlayPause on play button press', async () => {
    const user = userEvent.setup();
    await render(<PlayerControls {...mockProps} />);
    await user.press(screen.getByLabelText('Pause'));
    expect(mockProps.onTogglePlayPause).toHaveBeenCalledTimes(1);
  });

  it('should call skipNext and skipPrevious', async () => {
    const user = userEvent.setup();
    await render(<PlayerControls {...mockProps} />);
    await user.press(screen.getByLabelText('Next track'));
    expect(mockProps.onSkipNext).toHaveBeenCalledTimes(1);
    await user.press(screen.getByLabelText('Previous track'));
    expect(mockProps.onSkipPrevious).toHaveBeenCalledTimes(1);
  });

  it('should seek relative on rewind/forward buttons', async () => {
    const user = userEvent.setup();
    await render(<PlayerControls {...mockProps} size="large" />);
    await user.press(screen.getByLabelText('Rewind 10 seconds'));
    expect(mockProps.onSeekRelative).toHaveBeenCalledWith(-10);
    await user.press(screen.getByLabelText('Forward 10 seconds'));
    expect(mockProps.onSeekRelative).toHaveBeenCalledWith(10);
  });

  it('should show loading indicator when buffering', async () => {
    await render(<PlayerControls {...mockProps} status="buffering" />);
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should render 5 buttons in large mode', async () => {
    await render(<PlayerControls {...mockProps} size="large" />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('should render 3 buttons in small mode', async () => {
    await render(
      <PlayerControls {...mockProps} size="small" onSeekRelative={undefined} />
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });
});
