// Inline feedback that replaces alert(), errors are announced at once and the rest politely
import { ReactNode } from 'react';
import Icon from './Icon';

export type BannerTone = 'info' | 'success' | 'warning' | 'error';

interface BannerProps {
  tone: BannerTone;
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
}

const BannerIcon: React.FC<{ tone: BannerTone }> = ({ tone }) => {
  if (tone === 'success') return <Icon name="check" size={18} className="rc-banner__icon" />;
  if (tone === 'error') return <Icon name="alert" size={18} className="rc-banner__icon" />;
  if (tone === 'warning') {
    return (
      <span className="rc-banner__icon rc-banner__badge" aria-hidden="true">
        !
      </span>
    );
  }
  return <Icon name="info" size={18} className="rc-banner__icon" />;
};

const Banner: React.FC<BannerProps> = ({ tone, title, children, onDismiss, className, testId }) => (
  <div
    className={`rc-banner rc-banner--${tone}${className ? ` ${className}` : ''}`}
    role={tone === 'error' ? 'alert' : 'status'}
    data-testid={testId}
  >
    <BannerIcon tone={tone} />
    <div className="rc-banner__content">
      {title && <strong className="rc-banner__title">{title} </strong>}
      {children}
    </div>
    {onDismiss && (
      <button type="button" className="rc-btn rc-btn--quiet rc-btn--icon rc-btn--sm rc-banner__dismiss" aria-label="Dismiss" onClick={onDismiss}>
        <Icon name="close" size={14} />
      </button>
    )}
  </div>
);

export default Banner;
