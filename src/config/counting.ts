export const COUNTING_CHANNEL_ID = '1560968718484508763';
export const COUNTING_VARIATION = 10;

export const COUNTING_MODES = {
  classic: { name: 'Classic', maxCount: 50, description: 'Count up by 1.' },
  double: { name: 'Double', maxCount: 100, description: 'Count up by 2.' },
  triple: { name: 'Triple', maxCount: 150, description: 'Count up by 3.' },
  five: { name: 'Five Steps', maxCount: 250, description: 'Count up by 5.' },
  countdown: {
    name: 'Countdown',
    maxCount: 50,
    description: 'Count backwards to 0.',
  },
  prime: {
    name: 'Prime Numbers',
    maxCount: 100,
    variation: 10,
    description: 'Count using prime numbers only.',
  },
  roman: {
    name: 'Roman Numbers',
    maxCount: 50,
    description: 'Count using Roman numerals (I, II, III...).',
  },
} as const;

export type CountingMode = keyof typeof COUNTING_MODES;
