import { durationInWords } from './duration-in-words';

const ONE_SECOND = 1;
const UNDER_A_MINUTE_SECONDS = 42;
const ONE_MINUTE_SECONDS = 60;
const PARTIAL_MINUTE_SECONDS = 61;
const SIGN_IN_COOLDOWN_SECONDS = 600;

describe('durationInWords', () => {
  test('describes a wait under a minute in seconds', () => {
    expect(durationInWords(UNDER_A_MINUTE_SECONDS)).toBe(`${UNDER_A_MINUTE_SECONDS} seconds`);
  });

  test('uses the singular for one second and one minute', () => {
    expect(durationInWords(ONE_SECOND)).toBe('1 second');
    expect(durationInWords(ONE_MINUTE_SECONDS)).toBe('1 minute');
  });

  test('rounds a wait of a minute or more up to whole minutes', () => {
    expect(durationInWords(PARTIAL_MINUTE_SECONDS)).toBe('2 minutes');
    expect(durationInWords(SIGN_IN_COOLDOWN_SECONDS)).toBe('10 minutes');
  });
});
