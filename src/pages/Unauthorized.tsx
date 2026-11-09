import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/usePageChrome';
import AuthShell from '../components/AuthShell';
import Button from '../components/ui/Button';

// Shown when the signed-in account lacks the Researcher role or the profile could not be loaded
const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  useDocumentTitle('Researcher access needed');

  const handleSignInAgain = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <AuthShell>
      <div className="rc-auth-card">
        <div className="rc-auth-card__intro">
          <p className="rc-eyebrow">Access</p>
          <h1 className="rc-title">Researcher access needed</h1>
          <p className="rc-muted">
            This account does not have the <strong>Researcher</strong> role right now, or your sign-in has expired.
          </p>
        </div>
        <p>If you believe you should have access, ask the WildlifeNL team to add the Researcher role to your account.</p>
        <Button variant="primary" size="lg" block onClick={handleSignInAgain}>
          Sign in again
        </Button>
      </div>
    </AuthShell>
  );
};

export default Unauthorized;
