// Account button in the top bar with the researcher's name, opening Profile and Sign out
import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../context/UserContext';
import { initials } from '../utils/format';
import Icon from './ui/Icon';

export const signOut = (navigate: (to: string) => void): void => {
  localStorage.removeItem('authToken');
  navigate('/login');
};

const AccountMenu: React.FC = () => {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const items = containerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    items?.[0]?.focus();

    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  // Arrow keys move between the menu items, Tab leaves the menu
  const handleMenuKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className="rc-popover" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="rc-account"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        data-testid="account-menu-button"
      >
        <span className="rc-account__avatar" aria-hidden="true">
          {initials(user?.name)}
        </span>
        <span className="rc-account__name">{user?.name ?? 'Account'}</span>
        <Icon name="chevron-down" size={12} />
      </button>

      {open && (
        <div className="rc-menu" role="menu" id={menuId} aria-label="Account" onKeyDown={handleMenuKeys}>
          {user && (
            <div className="rc-menu__meta" role="presentation">
              <strong>{user.name}</strong>
              <span className="rc-muted">{user.email}</span>
            </div>
          )}
          <Link role="menuitem" className="rc-menu__item" to="/profile" onClick={() => setOpen(false)}>
            <Icon name="user" />
            Profile
          </Link>
          <button role="menuitem" type="button" className="rc-menu__item" onClick={() => signOut(navigate)}>
            <Icon name="sign-out" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
