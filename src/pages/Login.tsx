import React, { useState, useEffect } from 'react';
import OTPPopup from '../popups/OTPPopup';
import { requestOTP } from '../services/authService';
import '../styles/Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [showOTP, setShowOTP] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dotCount, setDotCount] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 500);
    } else {
      setDotCount(0);
    }
    return () => {
      clearInterval(interval);
    };
  }, [loading]);

  const extractDisplayName = (email: string): string => {
    const emailLocalPart = email.split('@')[0];
    const nameParts = emailLocalPart.split(/[^a-zA-Z0-9]+/);
    const capitalizedParts = nameParts.map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1)
    );
    return capitalizedParts.join(' ');
  };


  const handleRequestOTP = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await requestOTP(email);
      if (response.ok) {
        setShowOTP(true);
      } else {
        alert('Failed to send OTP, please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Left side for ResearchConnect text and login form */}
      <div className="left-section">
        <div className="top-content">
          <div className="ResearchConnectText">
            <h1>ResearchConnect</h1>
          </div>
        </div>
        <div className="login-container">
          <div className="login-form">
            <form onSubmit={handleRequestOTP}>
              <label className="email-label" htmlFor="email-input">
                Email
              </label>
              <div className="input-bar">
                <input
                  type="email"
                  id="email-input"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                  required
                />
              </div>
              <button type="submit" className="signin-button" disabled={loading}>
                {loading ? `Signing in${'.'.repeat(dotCount)}` : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side for logo and WildlifeNL */}
      <div className="right-section">
        <div className="top-content">
          <div className="WildlifeNLContainer">
            <img
              className="LoginLogo"
              src="../assets/loginlogo.png"
              alt="WildlifeNL Logo"
            />
            <div className="WildlifeNLText">
              <h1>WildlifeNL</h1>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Popup */}
      {showOTP && (
        <div className="popup-overlay">
          <div className="popup-content">
            <OTPPopup email={email} onClose={() => setShowOTP(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
