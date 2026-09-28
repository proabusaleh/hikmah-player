import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';

import { HikmahButton } from '@/components/common/HikmahButton';

describe('HikmahButton', () => {
  it('should render title', async () => {
    await render(<HikmahButton title="Play" onPress={() => {}} />);
    expect(screen.getByText('Play')).toBeTruthy();
  });

  it('should call onPress when pressed', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<HikmahButton title="Play" onPress={onPress} />);
    await user.press(screen.getByText('Play'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<HikmahButton title="Play" onPress={onPress} disabled />);
    await user.press(screen.getByText('Play'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should show loading indicator when loading', async () => {
    await render(<HikmahButton title="Play" onPress={() => {}} loading />);
    expect(screen.queryByText('Play')).toBeNull();
    expect(screen.getByTestId('button-loading')).toBeTruthy();
  });
});
