import { useNavigate } from 'react-router-dom';
import '../styles/Unauthorized.css';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };


  return (
    <div className="container">
      <h1>Unauthorized Access</h1>
      <p>
        It seems like you don't have the <strong>Researcher</strong> role right now.
      </p>
      <p>
        If you believe this is a mistake or you should have the necessary role,
        please contact the organization
      </p>

      <button className="retry-button" onClick={handleLogout}>
              Retry
      </button>
    </div>

    
  );
};


export default Unauthorized;
