import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import { API_BASE_URL } from '../apiBaseUrl';

const APP_VERSION = process.env.REACT_APP_VERSION || 'dev';
const IS_TEST_ENVIRONMENT = API_BASE_URL.includes('test-api');

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      {/* Logo and WildlifeNL Text */}
      <div className="navbar-left">
        <img
          src="../assets/navbarlogo.png"
          alt="WildlifeNL Logo"
          className="navbar-logo"
        />
        <h1 className="navbar-title">WildlifeNL</h1>
        <span className="navbar-version" data-testid="navbar-version">
          v{APP_VERSION}{IS_TEST_ENVIRONMENT ? ' TEST' : ''}
        </span>
      </div>

      {/* Action Components */}
      <div className="navbar-actions">
        {/* Dashboard */}
        <div
          className="navbar-action"
          onClick={() => navigate('/dashboard')}
        >
          <img
            src="../assets/DashboardSVG.svg"
            alt="Dashboard"
            className="navbar-icon"
          />
          <p>Dashboard</p>
        </div>

        {/* Profile */}
        <div
          className="navbar-action"
          onClick={() => navigate('/profile')}
        >
          <img
            src="../assets/ProfileSVG.svg"
            alt="Profile"
            className="navbar-icon"
          />
          <p>Profile</p>
        </div>

        {/* Export */}
        <div
          className="navbar-action"
          onClick={() => navigate('/export')}
        >
          <img
            src="../assets/ExportSVG.svg"
            alt="Export"
            className="navbar-icon"
          />
          <p>Export</p>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
