// 56px top bar: brand, main navigation, version with the TEST badge and the account menu, which becomes a sheet on phone
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import { APP_VERSION, IS_TEST_ENVIRONMENT, LOGO_SRC } from '../appInfo';
import { useCurrentUser } from '../context/UserContext';
import { PHONE_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import AccountMenu, { signOut } from './AccountMenu';
import Dialog from './ui/Dialog';
import Icon from './ui/Icon';

type Section = 'experiments' | 'export' | 'profile';

const sectionOf = (pathname: string): Section => {
  if (pathname.startsWith('/export')) return 'export';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'experiments';
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [sheetOpen, setSheetOpen] = useState(false);

  const section = sectionOf(location.pathname);
  // "page" on the list itself, "true" on pages inside the section such as an experiment
  const currentFor = (target: Section, home: string) =>
    section !== target ? undefined : location.pathname === home ? ('page' as const) : ('true' as const);

  const links = (
    <>
      <Link to="/dashboard" aria-current={currentFor('experiments', '/dashboard')} onClick={() => setSheetOpen(false)}>
        Experiments
      </Link>
      <Link to="/export" aria-current={currentFor('export', '/export')} onClick={() => setSheetOpen(false)}>
        Export
      </Link>
    </>
  );

  return (
    <header className="rc-topbar">
      <Link to="/dashboard" className="rc-topbar__brand">
        <img src={LOGO_SRC} alt="" width={32} height={32} />
        <span className="rc-topbar__wordmark">ResearchConnect</span>
      </Link>

      {!isPhone && (
        <nav className="rc-topbar__nav" aria-label="Main">
          {links}
        </nav>
      )}

      <div className="rc-topbar__end">
        <span className="rc-topbar__version" data-testid="navbar-version">
          <span className="rc-topbar__version-number">v{APP_VERSION}</span>
          {IS_TEST_ENVIRONMENT && <span className="rc-topbar__badge"> TEST</span>}
        </span>

        {isPhone ? (
          <button type="button" className="rc-topbar__menu-button" aria-haspopup="dialog" onClick={() => setSheetOpen(true)}>
            <Icon name="menu" size={18} />
            <span className="rc-topbar__menu-label">Menu</span>
          </button>
        ) : (
          <AccountMenu />
        )}
      </div>

      {isPhone && (
        <Dialog open={sheetOpen} onClose={() => setSheetOpen(false)} title="Menu" variant="sheet" description={user ? `${user.name} · ${user.email}` : undefined}>
          <nav className="rc-sheet-nav" aria-label="Main">
            {links}
            <Link to="/profile" aria-current={section === 'profile' ? 'page' : undefined} onClick={() => setSheetOpen(false)}>
              Profile
            </Link>
          </nav>
          <button type="button" className="rc-btn rc-btn--secondary rc-btn--block" onClick={() => signOut(navigate)}>
            <Icon name="sign-out" />
            Sign out
          </button>
        </Dialog>
      )}
    </header>
  );
};

export default Navbar;
