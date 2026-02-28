import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { handler } from '../lib/lambda/post-confirmation/index';

describe('Post-Confirmation Lambda handler', () => {
  it('returns the input event unchanged', async () => {
    const event = {
      version: '1',
      triggerSource: 'PostConfirmation_ConfirmSignUp',
      region: 'us-east-1',
      userPoolId: 'us-east-1_test',
      userName: 'testuser',
      request: { userAttributes: { email: 'test@example.com', sub: 'abc-123' } },
      response: {},
    };
    const result = await handler(event);
    expect(result).toBe(event);
  });

  it('logs the event to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const event = { triggerSource: 'PostConfirmation_ConfirmSignUp' };
    await handler(event);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Post-confirmation trigger invoked',
      JSON.stringify(event),
    );
    consoleSpy.mockRestore();
  });

  it('Property 3: Post-confirmation trigger round trip — handler returns event unchanged for any input', async () => {
    // Validates: Requirement 4.3
    // Uses fast-check to generate arbitrary event objects and assert identity function
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          version: fc.string(),
          triggerSource: fc.string(),
          region: fc.string(),
          userPoolId: fc.string(),
          userName: fc.string(),
          request: fc.record({
            userAttributes: fc.dictionary(fc.string(), fc.string()),
          }),
          response: fc.record({}),
        }),
        async (event) => {
          const result = await handler(event);
          return result === event;
        },
      ),
      { numRuns: 100 },
    );
  });
});
