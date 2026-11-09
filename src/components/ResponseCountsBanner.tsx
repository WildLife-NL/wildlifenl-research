// Says how many response counts are missing and why, with a retry that counts only those again
import { RateLimitError } from '../services/problemDetails';
import { pluralize } from '../utils/format';
import Banner from './ui/Banner';

interface ResponseCountsBannerProps {
  missing: number;
  rateLimit: RateLimitError | null;
  retrying: boolean;
  onRetry: () => void;
}

const ResponseCountsBanner: React.FC<ResponseCountsBannerProps> = ({ missing, rateLimit, retrying, onRetry }) => {
  if (missing === 0) return null;
  const shown = missing === 1 ? 'it shows' : 'they show';

  return (
    <Banner tone="warning" title={`${pluralize(missing, 'response count')} couldn't be loaded.`} testId="response-counts-banner">
      {rateLimit
        ? `The WildlifeNL API asked ResearchConnect to slow down, so ${shown} — for now. Wait ${rateLimit.retryAfter} seconds before you try again.`
        : `The WildlifeNL API did not answer, so ${shown} — for now.`}{' '}
      <button type="button" className="rc-linkbtn" onClick={onRetry} disabled={retrying} data-testid="response-counts-retry">
        {retrying ? 'Trying again…' : 'Try again'}
      </button>
    </Banner>
  );
};

export default ResponseCountsBanner;
