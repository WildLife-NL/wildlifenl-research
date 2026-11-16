import { getProblemMessage, getRateLimitError, isRateLimited, RateLimitError } from '../problemDetails';
import { getMyProfile } from '../profileService';
import { verifyOTP } from '../authService';
import { addResponseCounts } from '../responseService';
import { Experiment } from '../../types/experiment';

// The API's rate limit: 429 answers become a RateLimitError, and response counts it refuses stay unknown instead of 0

const apiResponse = (status: number, body: any, headers: Record<string, string> = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
  }) as unknown as Response;

const TOO_MANY = { title: 'Too Many Requests', status: 429, detail: 'Too many requests. Please slow down.' };

const experiment = (ID: string, responses?: number): Experiment =>
  ({ ID, name: `Testing ${ID}`, description: 'Testing', start: '2025-11-19T00:00:00Z', end: '', responses } as Experiment);

describe('rate limit - Unit Tests', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    localStorage.setItem('authToken', 'testing-token');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('A 429 WAITS THE SHORTEST API COOLDOWN WHEN RETRY-AFTER IS NOT READABLE', () => {
    const error = getRateLimitError(apiResponse(429, TOO_MANY));

    expect(error).toBeInstanceOf(RateLimitError);
    expect(isRateLimited(error)).toBe(true);
    expect(error?.retryAfter).toBe(15);
    expect(error?.message).toBe('The WildlifeNL API asked ResearchConnect to slow down. Try again in 15 seconds.');
  });

  test('READS RETRY-AFTER ONCE THE API EXPOSES IT', () => {
    expect(getRateLimitError(apiResponse(429, TOO_MANY, { 'retry-after': '31' }))?.retryAfter).toBe(31);
  });

  test('OTHER ERRORS ARE NOT A RATE LIMIT', () => {
    expect(getRateLimitError(apiResponse(500, {}))).toBeNull();
    expect(isRateLimited(new Error('Failed to fetch'))).toBe(false);
  });

  test('THE PROBLEM MESSAGE OF A 429 SAYS HOW LONG TO WAIT', async () => {
    await expect(getProblemMessage(apiResponse(429, TOO_MANY), 'Failed to fetch interactions')).resolves.toContain('Try again in 15 seconds');
  });

  test('THE PROFILE CHECK THROWS A RATE LIMIT ERROR ON 429', async () => {
    fetchMock.mockResolvedValue(apiResponse(429, TOO_MANY));

    await expect(getMyProfile()).rejects.toBeInstanceOf(RateLimitError);
  });

  test('THE CODE CHECK THROWS A RATE LIMIT ERROR ON 429 BUT STILL RETURNS NULL FOR A WRONG CODE', async () => {
    fetchMock.mockResolvedValueOnce(apiResponse(429, TOO_MANY));
    await expect(verifyOTP('testing@example.com', '123456')).rejects.toBeInstanceOf(RateLimitError);

    fetchMock.mockResolvedValueOnce(apiResponse(401, { title: 'Unauthorized' }));
    await expect(verifyOTP('testing@example.com', '123456')).resolves.toBeNull();
  });

  test('RESPONSE COUNTS THE API REFUSES STAY UNDEFINED AND KNOWN COUNTS ARE NOT FETCHED AGAIN', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/responses/experiment/counted') ? apiResponse(200, [{ ID: 'r1' }, { ID: 'r2' }]) : apiResponse(429, TOO_MANY)
    );

    const result = await addResponseCounts([experiment('counted'), experiment('known', 7), experiment('refused')]);

    expect(result.experiments.map((exp) => exp.responses)).toEqual([2, 7, undefined]);
    expect(result.rateLimit?.retryAfter).toBe(15);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('RESPONSE COUNTS WITHOUT ERRORS REPORT NO RATE LIMIT', async () => {
    fetchMock.mockResolvedValue(apiResponse(200, null));

    const result = await addResponseCounts([experiment('empty')]);

    expect(result.experiments[0].responses).toBe(0);
    expect(result.rateLimit).toBeNull();
  });
});
