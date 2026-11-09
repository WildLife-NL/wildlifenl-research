// Modal dialog and bottom sheet, with Escape, backdrop click, a focus trap and focus returned to the opener
import { ReactNode, RefObject, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

interface DialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'center' | 'sheet';
  compact?: boolean;
  flushBody?: boolean;
  dismissible?: boolean;
  initialFocusRef?: RefObject<HTMLElement>;
  testId?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'sm',
  variant = 'center',
  compact = false,
  flushBody = false,
  dismissible = true,
  initialFocusRef,
  testId,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    const first = initialFocusRef?.current ?? dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog;
    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, [open, dismissible, initialFocusRef]);

  if (!open) return null;

  const dialogClass = [
    'rc-dialog',
    size !== 'sm' ? `rc-dialog--${size}` : '',
    variant === 'sheet' ? 'rc-dialog--sheet' : '',
    compact ? 'rc-dialog--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div
      className={`rc-dialog-backdrop${variant === 'sheet' ? ' rc-dialog-backdrop--sheet' : ''}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={dialogClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-testid={testId}
      >
        <div className="rc-dialog__header">
          <div className="rc-dialog__heading">
            <h2 id={titleId} className="rc-dialog__title">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="rc-dialog__description">
                {description}
              </p>
            )}
          </div>
          {dismissible && !compact && (
            <button type="button" className="rc-btn rc-btn--quiet rc-btn--icon rc-btn--md" aria-label="Close" onClick={onClose}>
              <Icon name="close" />
            </button>
          )}
        </div>
        {children && <div className={`rc-dialog__body${flushBody ? ' rc-dialog__body--flush' : ''}`}>{children}</div>}
        {footer && <div className="rc-dialog__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
