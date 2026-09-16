import { describe, expect, it } from 'vitest';

import { nextStage } from '../domain/stage.js';

describe('the assignment lifecycle', () => {
  it('moves an offer on to an acceptance', () => {
    expect(nextStage('Offered')).toBe('Accepted');
  });

  it('has nothing after a payment', () => {
    expect(nextStage('Paid')).toBeNull();
  });
});
