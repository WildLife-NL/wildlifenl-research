// Layout of the signed-out pages: the form on paper beside the bark-brown WildlifeNL panel, which moves on top on narrow screens
import { ReactNode } from 'react';
import { API_LABEL, APP_VERSION, LOGO_SRC } from '../appInfo';
import '../styles/Login.css';

const AuthShell: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="rc-auth">
    <div className="rc-auth__main">
      <div className="rc-auth__brand-row">
        <img src={LOGO_SRC} alt="WildlifeNL" width={28} height={28} />
        <span className="rc-auth__product">ResearchConnect</span>
        <span className="rc-auth__tagline">WildlifeNL · researcher portal</span>
      </div>

      <main className="rc-auth__center">{children}</main>

      <p className="rc-auth__version" data-testid="auth-version">
        v{APP_VERSION} · {API_LABEL}
      </p>
    </div>

    <aside className="rc-auth__panel" aria-label="About WildlifeNL">
      <div className="rc-auth__panel-brand">
        <img src={LOGO_SRC} alt="" width={48} height={48} />
        <span>WildlifeNL</span>
      </div>
      <div className="rc-auth__panel-copy">
        <p className="rc-auth__quote">Field research with the people who watch wildlife.</p>
        <p className="rc-auth__panel-text">
          Set up experiments in living labs, build questionnaires, send triggered messages to app users, and export what comes back.
        </p>
      </div>
    </aside>
  </div>
);

export default AuthShell;
