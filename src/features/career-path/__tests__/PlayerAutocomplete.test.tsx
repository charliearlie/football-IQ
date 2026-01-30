/**
 * TDD tests for PlayerAutocomplete component.
 * Tests written BEFORE implementation.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PlayerAutocomplete } from '@/components/PlayerAutocomplete';
import * as HybridSearchEngine from '@/services/player/HybridSearchEngine';
import { UnifiedPlayer } from '@/services/oracle/types';

jest.mock('@/services/player/HybridSearchEngine');

const mockPlayer: UnifiedPlayer = {
  id: 'Q11571',
  name: 'Cristiano Ronaldo',
  nationality_code: 'PT',
  birth_year: 1985,
  position_category: 'Forward',
  source: 'oracle',
  relevance_score: 1.0,
};

const mockPlayer2: UnifiedPlayer = {
  id: 'Q11239',
  name: 'Ronaldo',
  nationality_code: 'BR',
  birth_year: 1976,
  position_category: 'Forward',
  source: 'oracle',
  relevance_score: 0.9,
};

describe('PlayerAutocomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search input', () => {
    const { getByPlaceholderText } = render(
      <PlayerAutocomplete
        onSelect={jest.fn()}
        onSubmitText={jest.fn()}
        shouldShake={false}
        isGameOver={false}
      />
    );

    expect(getByPlaceholderText('Search player...')).toBeTruthy();
  });

  it('does not show dropdown when query is less than 3 characters', () => {
    (HybridSearchEngine.searchPlayersHybrid as jest.Mock).mockImplementation(
      (_q: string, onUpdate: (r: UnifiedPlayer[]) => void) => {
        onUpdate([]);
        return Promise.resolve();
      }
    );

    const { getByPlaceholderText, queryByTestId } = render(
      <PlayerAutocomplete
        onSelect={jest.fn()}
        onSubmitText={jest.fn()}
        shouldShake={false}
        isGameOver={false}
        testID="autocomplete"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search player...'), 'ab');
    expect(queryByTestId('autocomplete-dropdown')).toBeNull();
  });

  it('shows dropdown with results when query >= 3 characters', async () => {
    (HybridSearchEngine.searchPlayersHybrid as jest.Mock).mockImplementation(
      (_q: string, onUpdate: (r: UnifiedPlayer[]) => void) => {
        onUpdate([mockPlayer]);
        return Promise.resolve();
      }
    );

    const { getByPlaceholderText, getByText } = render(
      <PlayerAutocomplete
        onSelect={jest.fn()}
        onSubmitText={jest.fn()}
        shouldShake={false}
        isGameOver={false}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search player...'), 'ronaldo');

    await waitFor(() => {
      expect(getByText(/Cristiano Ronaldo/)).toBeTruthy();
    });
  });

  it('calls onSelect with player when result is tapped', async () => {
    const onSelect = jest.fn();

    (HybridSearchEngine.searchPlayersHybrid as jest.Mock).mockImplementation(
      (_q: string, onUpdate: (r: UnifiedPlayer[]) => void) => {
        onUpdate([mockPlayer]);
        return Promise.resolve();
      }
    );

    const { getByPlaceholderText, getByText } = render(
      <PlayerAutocomplete
        onSelect={onSelect}
        onSubmitText={jest.fn()}
        shouldShake={false}
        isGameOver={false}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search player...'), 'ronaldo');

    await waitFor(() => getByText(/Cristiano Ronaldo/));
    fireEvent.press(getByText(/Cristiano Ronaldo/));

    expect(onSelect).toHaveBeenCalledWith(mockPlayer);
  });

  it('displays flag emoji and metadata in result items', async () => {
    (HybridSearchEngine.searchPlayersHybrid as jest.Mock).mockImplementation(
      (_q: string, onUpdate: (r: UnifiedPlayer[]) => void) => {
        onUpdate([mockPlayer]);
        return Promise.resolve();
      }
    );

    const { getByPlaceholderText, getByText } = render(
      <PlayerAutocomplete
        onSelect={jest.fn()}
        onSubmitText={jest.fn()}
        shouldShake={false}
        isGameOver={false}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search player...'), 'ronaldo');

    // Should display format: 🇵🇹 Cristiano Ronaldo (Forward, b. 1985)
    await waitFor(() => {
      expect(getByText(/Forward/)).toBeTruthy();
      expect(getByText(/1985/)).toBeTruthy();
    });
  });

  it('disambiguates Brazilian vs Portuguese Ronaldo', async () => {
    (HybridSearchEngine.searchPlayersHybrid as jest.Mock).mockImplementation(
      (_q: string, onUpdate: (r: UnifiedPlayer[]) => void) => {
        onUpdate([mockPlayer, mockPlayer2]);
        return Promise.resolve();
      }
    );

    const { getByPlaceholderText, getByText } = render(
      <PlayerAutocomplete
        onSelect={jest.fn()}
        onSubmitText={jest.fn()}
        shouldShake={false}
        isGameOver={false}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search player...'), 'ronaldo');

    await waitFor(() => {
      expect(getByText(/Cristiano Ronaldo/)).toBeTruthy();
      // Brazilian Ronaldo — different birth year for disambiguation
      expect(getByText(/1976/)).toBeTruthy();
      expect(getByText(/1985/)).toBeTruthy();
    });
  });

  it('disables input when game is over', () => {
    const { getByPlaceholderText } = render(
      <PlayerAutocomplete
        onSelect={jest.fn()}
        onSubmitText={jest.fn()}
        shouldShake={false}
        isGameOver={true}
      />
    );

    const input = getByPlaceholderText('Search player...');
    expect(input.props.editable).toBe(false);
  });

  it('clears dropdown and sets input text on selection', async () => {
    (HybridSearchEngine.searchPlayersHybrid as jest.Mock).mockImplementation(
      (_q: string, onUpdate: (r: UnifiedPlayer[]) => void) => {
        onUpdate([mockPlayer]);
        return Promise.resolve();
      }
    );

    const { getByPlaceholderText, getByText, queryByTestId } = render(
      <PlayerAutocomplete
        onSelect={jest.fn()}
        onSubmitText={jest.fn()}
        shouldShake={false}
        isGameOver={false}
        testID="autocomplete"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search player...'), 'ronaldo');
    await waitFor(() => getByText(/Cristiano Ronaldo/));
    fireEvent.press(getByText(/Cristiano Ronaldo/));

    // Dropdown should close after selection
    expect(queryByTestId('autocomplete-dropdown')).toBeNull();
  });

  it('calls onSubmitText when submit button is pressed without selection', () => {
    const onSubmitText = jest.fn();

    const { getByPlaceholderText, getByTestId } = render(
      <PlayerAutocomplete
        onSelect={jest.fn()}
        onSubmitText={onSubmitText}
        shouldShake={false}
        isGameOver={false}
        testID="autocomplete"
      />
    );

    fireEvent.changeText(getByPlaceholderText('Search player...'), 'Messi');
    fireEvent.press(getByTestId('autocomplete-submit'));

    expect(onSubmitText).toHaveBeenCalledWith('Messi');
  });
});
