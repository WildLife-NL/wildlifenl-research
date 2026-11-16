interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: { message?: string; location?: string }[];
}

export const NOT_ON_THIS_API = 'This export is not available on this WildlifeNL API yet.';

// The API allows each token a number of requests per minute and answers 429 with a cooldown after that
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super(`The WildlifeNL API asked ResearchConnect to slow down. Try again in ${retryAfter} seconds.`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    // Keeps instanceof working when TypeScript compiles the class to ES5
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

// The API's CORS headers do not expose Retry-After to the browser yet, so its shortest cooldown is the fallback
const DEFAULT_RETRY_AFTER_SECONDS = 15;

export const getRateLimitError = (response: Response): RateLimitError | null => {
  if (response.status !== 429) return null;
  const seconds = Number(response.headers?.get('Retry-After'));
  return new RateLimitError(seconds > 0 ? Math.ceil(seconds) : DEFAULT_RETRY_AFTER_SECONDS);
};

export const isRateLimited = (error: unknown): error is RateLimitError => error instanceof RateLimitError;

export const getProblemMessage = async (response: Response, fallback: string): Promise<string> => {
  const rateLimit = getRateLimitError(response);
  if (rateLimit) return rateLimit.message;
  try {
    const problem: ProblemDetails = await response.json();
    const fieldErrors = (problem.errors ?? [])
      .filter((error) => error.message)
      .map((error) => (error.location ? `${error.location.replace(/^body\./, '')}: ${error.message}` : error.message));
    const summary = problem.detail || problem.title || fallback;
    return [summary, ...fieldErrors].join('\n');
  } catch {
    return `${fallback} (status ${response.status})`;
  }
};
