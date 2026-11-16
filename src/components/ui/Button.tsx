// Labelled buttons and button-styled links, unavailable actions stay focusable and announce aria-disabled
import { ButtonHTMLAttributes, forwardRef, MouseEvent } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import Icon, { IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'accent' | 'danger' | 'danger-quiet' | 'dashed';
export type ButtonSize = 'sm' | 'md' | 'default' | 'lg';

interface ButtonLook {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export const buttonClassName = ({ variant = 'secondary', size = 'default', block, iconOnly, className }: ButtonLook): string =>
  [
    'rc-btn',
    `rc-btn--${variant}`,
    size !== 'default' ? `rc-btn--${size}` : '',
    block ? 'rc-btn--block' : '',
    iconOnly ? 'rc-btn--icon' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonLook {
  icon?: IconName;
  iconSize?: number;
  busy?: boolean;
  busyLabel?: string;
  unavailable?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant, size, block, iconOnly, className, icon, iconSize, busy, busyLabel, unavailable, children, onClick, type = 'button', ...rest },
    ref
  ) => {
    const inert = busy || unavailable;

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (inert) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName({ variant, size, block, iconOnly, className })}
        aria-disabled={inert ? true : undefined}
        aria-busy={busy ? true : undefined}
        onClick={handleClick}
        {...rest}
      >
        {busy ? <span className="rc-spinner rc-spinner--sm" aria-hidden="true" /> : icon && <Icon name={icon} size={iconSize} />}
        {busy && busyLabel ? busyLabel : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

interface ButtonLinkProps extends LinkProps, ButtonLook {
  icon?: IconName;
}

export const ButtonLink: React.FC<ButtonLinkProps> = ({ variant, size, block, iconOnly, className, icon, children, ...rest }) => (
  <Link className={buttonClassName({ variant, size, block, iconOnly, className })} {...rest}>
    {icon && <Icon name={icon} />}
    {children}
  </Link>
);

export default Button;
