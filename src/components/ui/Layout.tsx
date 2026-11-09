// Small layout primitives: empty state, segmented control, breadcrumbs, page header, field, action bar and phone frame
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, children, action }) => (
  <div className="rc-empty">
    <p className="rc-empty__title">{title}</p>
    {children && <p className="rc-empty__text">{children}</p>}
    {action && <div className="rc-empty__action">{action}</div>}
  </div>
);

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  testId?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'default';
  block?: boolean;
}

export const SegmentedControl = <T extends string>({ label, options, value, onChange, size = 'default', block }: SegmentedControlProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className={`rc-segmented${size === 'sm' ? ' rc-segmented--sm' : ''}${block ? ' rc-segmented--block' : ''}`}
  >
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        className="rc-segmented__option"
        aria-pressed={option.value === value}
        data-testid={option.testId}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export interface Crumb {
  label: string;
  to?: string;
  state?: unknown;
}

export const Breadcrumbs: React.FC<{ items: Crumb[] }> = ({ items }) => (
  <nav className="rc-crumbs" aria-label="Breadcrumb">
    <ol>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return [
          <li key={`crumb-${index}`} aria-current={last ? 'page' : undefined}>
            {item.to && !last ? (
              <Link to={item.to} state={item.state}>
                {item.label}
              </Link>
            ) : (
              item.label
            )}
          </li>,
          !last && (
            <li key={`sep-${index}`} aria-hidden="true">
              /
            </li>
          ),
        ];
      })}
    </ol>
  </nav>
);

interface PageHeaderProps {
  breadcrumbs?: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  titleTestId?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  actionsNote?: ReactNode;
  actionsNoteId?: string;
  alignEnd?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  eyebrow,
  title,
  titleTestId,
  meta,
  actions,
  actionsNote,
  actionsNoteId,
  alignEnd,
}) => (
  <>
    {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
    <div className={`rc-page-header${alignEnd ? ' rc-page-header--end' : ''}`}>
      <div className="rc-page-header__main">
        {eyebrow && <p className="rc-eyebrow">{eyebrow}</p>}
        <h1 className="rc-title" data-testid={titleTestId}>
          {title}
        </h1>
        {meta && <div className="rc-page-header__meta">{meta}</div>}
      </div>
      {(actions || actionsNote) && (
        <div className="rc-page-header__actions">
          {actions && <div className="rc-page-header__buttons">{actions}</div>}
          {actionsNote && (
            <p className="rc-page-header__note" id={actionsNoteId}>
              {actionsNote}
            </p>
          )}
        </div>
      )}
    </div>
  </>
);

interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  help?: ReactNode;
  error?: string | null;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

// Label above, helper below, error in words, and the control is told about both
export const Field: React.FC<FieldProps> = ({ id, label, hint, help, error, className, children }) => {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`rc-field${className ? ` ${className}` : ''}`}>
      <label htmlFor={id} className="rc-label">
        {label}
        {hint && <span className="rc-label__hint"> · {hint}</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error && (
        <span id={errorId} className="rc-error">
          <Icon name="alert" size={14} />
          {error}
        </span>
      )}
      {help && (
        <span id={helpId} className="rc-help">
          {help}
        </span>
      )}
    </div>
  );
};

interface ActionBarProps {
  status: ReactNode;
  tone?: 'neutral' | 'warning';
  children: ReactNode;
}

export const ActionBar: React.FC<ActionBarProps> = ({ status, tone = 'neutral', children }) => (
  <div className="rc-action-bar">
    <div className="rc-action-bar__inner">
      <span className={`rc-action-bar__status${tone === 'warning' ? ' rc-action-bar__status--warning' : ''}`} role="status">
        {status}
      </span>
      <div className="rc-action-bar__buttons">{children}</div>
    </div>
  </div>
);

interface PhoneFrameProps {
  label: string;
  variant?: 'screen' | 'notification';
  caption?: ReactNode;
  children: ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ label, variant = 'screen', caption, children }) => (
  <figure className="rc-phone-figure" aria-label={label}>
    <div className={`rc-phone${variant === 'notification' ? ' rc-phone--notification' : ''}`}>{children}</div>
    {caption && <figcaption className="rc-phone__caption">{caption}</figcaption>}
  </figure>
);

interface LoadingStateProps {
  label?: string;
  testId?: string;
  page?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Loading…', testId, page }) => (
  <div className={`rc-loading${page ? ' rc-loading--page' : ''}`} role="status" data-testid={testId}>
    <span className="rc-spinner" aria-hidden="true" />
    {label}
  </div>
);
