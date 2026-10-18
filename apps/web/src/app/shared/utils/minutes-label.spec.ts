import { minutesLabel } from './minutes-label';

const SHORT_ARTICLE_MINUTES = 25;
const TWO_HOUR_COURSE_MINUTES = 120;
const LONG_COURSE_MINUTES = 100;

describe('minutesLabel', () => {
  test('shows minutes alone under an hour', () => {
    expect(minutesLabel(SHORT_ARTICLE_MINUTES)).toBe(`${SHORT_ARTICLE_MINUTES}m`);
  });

  test('drops the minutes on an exact hour', () => {
    expect(minutesLabel(TWO_HOUR_COURSE_MINUTES)).toBe('2h');
  });

  test('shows hours and the remaining minutes otherwise', () => {
    expect(minutesLabel(LONG_COURSE_MINUTES)).toBe('1h 40m');
  });
});
