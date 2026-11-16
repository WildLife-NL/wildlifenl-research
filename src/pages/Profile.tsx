import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../context/UserContext';
import { useDocumentTitle } from '../hooks/usePageChrome';
import { signOut } from '../components/AccountMenu';
import Button from '../components/ui/Button';
import { LoadingState, PageHeader } from '../components/ui/Layout';
import { initials } from '../utils/format';
import '../styles/Profile.css';

// The signed-in researcher's account, read from the profile the app shell already loaded
const Profile: React.FC = () => {
  const navigate = useNavigate();
  const user = useCurrentUser();
  useDocumentTitle('Profile');

  if (!user) {
    return (
      <div className="rc-page">
        <LoadingState label="Loading your profile…" />
      </div>
    );
  }

  return (
    <div className="rc-page rc-page--narrow">
      <PageHeader title="Profile" meta={<span>Your WildlifeNL account as ResearchConnect sees it</span>} />

      <section className="rc-card" aria-labelledby="profile-account">
        <div className="rc-profile__identity">
          <span className="rc-profile__avatar" aria-hidden="true">
            {initials(user.name)}
          </span>
          <div>
            <h2 id="profile-account" className="rc-section-title">
              {user.name}
            </h2>
            <p className="rc-muted">{user.email}</p>
          </div>
        </div>
        <dl className="rc-dl">
          <dt>Name</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>{user.roles.length === 1 ? 'Role' : 'Roles'}</dt>
          <dd>{user.roles.map((role) => role.name).join(', ') || '—'}</dd>
        </dl>
        <p className="rc-help">Names, email addresses and roles are managed by the WildlifeNL team.</p>
        <div>
          <Button variant="secondary" icon="sign-out" onClick={() => signOut(navigate)}>
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Profile;
