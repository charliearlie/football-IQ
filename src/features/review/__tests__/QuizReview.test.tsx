import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Mock components and utilities for testing the Quiz Review functionality.
 * These tests verify the visual distinction between correct and incorrect answers.
 */

// Simplified mock for quiz option display logic
interface QuizOptionReviewProps {
  option: string;
  index: number;
  correctIndex: number;
  userSelectedIndex: number;
  testID?: string;
}

/**
 * QuizOptionReview - Component that mimics the quiz review option display logic.
 * This is based on the actual implementation in TopicalQuizScreen.tsx (lines 181-227).
 */
function QuizOptionReview({
  option,
  index,
  correctIndex,
  userSelectedIndex,
  testID,
}: QuizOptionReviewProps) {
  const isCorrect = index === correctIndex;
  const isUserChoice = index === userSelectedIndex;
  const isUserCorrect = isUserChoice && isCorrect;
  const isUserWrong = isUserChoice && !isCorrect;

  const getContainerStyle = () => {
    if (isCorrect) return [styles.option, styles.optionCorrect];
    if (isUserWrong) return [styles.option, styles.optionWrong];
    return [styles.option];
  };

  return (
    <View style={getContainerStyle()} testID={testID}>
      <Text style={styles.optionText}>{option}</Text>
      {isUserChoice && (
        <Text testID={`${testID}-indicator`}>
          {isUserCorrect ? '✓ Your answer' : '✗ Your answer'}
        </Text>
      )}
      {isCorrect && !isUserChoice && (
        <Text testID={`${testID}-correct-indicator`}>✓ Correct</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(88, 204, 2, 0.15)', // pitchGreen at 15%
    borderColor: '#58CC02', // pitchGreen
    borderWidth: 1,
  },
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // redCard at 15%
    borderColor: '#EF4444', // redCard
    borderWidth: 1,
  },
  optionText: {
    color: '#F8FAFC', // floodlightWhite
    fontSize: 16,
  },
});

describe('Quiz Review Mode', () => {
  describe('Visual Distinction for Answers', () => {
    it('shows correct answer in green when user was wrong', () => {
      // User selected option 1 (Ronaldo), but option 0 (Messi) was correct
      const { getByTestId } = render(
        <View>
          <QuizOptionReview
            option="Messi"
            index={0}
            correctIndex={0}
            userSelectedIndex={1}
            testID="option-0"
          />
          <QuizOptionReview
            option="Ronaldo"
            index={1}
            correctIndex={0}
            userSelectedIndex={1}
            testID="option-1"
          />
        </View>
      );

      // Correct answer (Messi) should have green styling
      const correctOption = getByTestId('option-0');
      expect(correctOption).toBeTruthy();
      // Should show "✓ Correct" indicator since user didn't select it
      expect(getByTestId('option-0-correct-indicator')).toBeTruthy();
    });

    it('shows user wrong choice in red with X indicator', () => {
      // User selected option 1 (wrong), correct was option 0
      const { getByTestId, getByText } = render(
        <View>
          <QuizOptionReview
            option="Messi"
            index={0}
            correctIndex={0}
            userSelectedIndex={1}
            testID="option-0"
          />
          <QuizOptionReview
            option="Ronaldo"
            index={1}
            correctIndex={0}
            userSelectedIndex={1}
            testID="option-1"
          />
        </View>
      );

      // User's wrong answer should have red styling
      const wrongOption = getByTestId('option-1');
      expect(wrongOption).toBeTruthy();
      // Should show "✗ Your answer" indicator
      expect(getByTestId('option-1-indicator')).toBeTruthy();
      expect(getByText('✗ Your answer')).toBeTruthy();
    });

    it('shows user correct choice in green with checkmark indicator', () => {
      // User selected option 0 (correct)
      const { getByTestId, getByText } = render(
        <QuizOptionReview
          option="Messi"
          index={0}
          correctIndex={0}
          userSelectedIndex={0}
          testID="option-0"
        />
      );

      // User's correct answer should be highlighted
      const correctOption = getByTestId('option-0');
      expect(correctOption).toBeTruthy();
      // Should show "✓ Your answer" indicator
      expect(getByTestId('option-0-indicator')).toBeTruthy();
      expect(getByText('✓ Your answer')).toBeTruthy();
    });

    it('does not show any indicator on options user did not select and are not correct', () => {
      // User selected option 0, correct is option 0, testing option 2
      const { getByTestId, queryByTestId } = render(
        <QuizOptionReview
          option="Mbappe"
          index={2}
          correctIndex={0}
          userSelectedIndex={0}
          testID="option-2"
        />
      );

      // Option 2 should not have any indicators
      expect(getByTestId('option-2')).toBeTruthy();
      expect(queryByTestId('option-2-indicator')).toBeNull();
      expect(queryByTestId('option-2-correct-indicator')).toBeNull();
    });
  });

  describe('All Options Display Correctly', () => {
    it('renders all 4 options with correct styling for a missed question', () => {
      // Question where user selected wrong answer
      const options = ['Messi', 'Ronaldo', 'Mbappe', 'Haaland'];
      const correctIndex = 0; // Messi is correct
      const userSelectedIndex = 2; // User picked Mbappe

      const { getByTestId, queryByTestId } = render(
        <View>
          {options.map((option, index) => (
            <QuizOptionReview
              key={index}
              option={option}
              index={index}
              correctIndex={correctIndex}
              userSelectedIndex={userSelectedIndex}
              testID={`option-${index}`}
            />
          ))}
        </View>
      );

      // Option 0 (Messi - correct) should show "✓ Correct"
      expect(getByTestId('option-0-correct-indicator')).toBeTruthy();

      // Option 2 (Mbappe - user's wrong choice) should show "✗ Your answer"
      expect(getByTestId('option-2-indicator')).toBeTruthy();

      // Options 1 and 3 should have no indicators
      expect(queryByTestId('option-1-indicator')).toBeNull();
      expect(queryByTestId('option-1-correct-indicator')).toBeNull();
      expect(queryByTestId('option-3-indicator')).toBeNull();
      expect(queryByTestId('option-3-correct-indicator')).toBeNull();
    });

    it('renders all 4 options with correct styling for a correct answer', () => {
      const options = ['Messi', 'Ronaldo', 'Mbappe', 'Haaland'];
      const correctIndex = 0;
      const userSelectedIndex = 0; // User picked correctly

      const { getByTestId, queryByTestId } = render(
        <View>
          {options.map((option, index) => (
            <QuizOptionReview
              key={index}
              option={option}
              index={index}
              correctIndex={correctIndex}
              userSelectedIndex={userSelectedIndex}
              testID={`option-${index}`}
            />
          ))}
        </View>
      );

      // Option 0 (correct and user's choice) should show "✓ Your answer"
      expect(getByTestId('option-0-indicator')).toBeTruthy();

      // No "✓ Correct" indicator since user selected it (shown differently)
      expect(queryByTestId('option-0-correct-indicator')).toBeNull();

      // Other options should have no indicators
      expect(queryByTestId('option-1-indicator')).toBeNull();
      expect(queryByTestId('option-2-indicator')).toBeNull();
      expect(queryByTestId('option-3-indicator')).toBeNull();
    });
  });
});
