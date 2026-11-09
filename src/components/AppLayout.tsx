// Shell around every signed-in page: skip link, top bar, the routed page and the footer
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { API_LABEL, APP_VERSION } from '../appInfo';
import Navbar from './Navbar';

const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstPage = useRef(true);

  // A new page starts at the top with focus on its content, as a full page load would for screen reader users
  useEffect(() => {
    window.scrollTo(0, 0);
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="rc-app">
      <a className="rc-skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="rc-main" tabIndex={-1} ref={mainRef}>
        <Outlet />
      </main>
      <footer className="rc-footer">
        <span>ResearchConnect · WildlifeNL</span>
        <span className="rc-mono">
          v{APP_VERSION} · {API_LABEL}
        </span>
      </footer>
    </div>
  );
};

export default AppLayout;
