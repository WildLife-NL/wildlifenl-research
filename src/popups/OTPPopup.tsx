import React, { useState, useEffect, useRef } from 'react';
import { verifyOTP, requestOTP } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import '../styles/OTPPopup.css';

interface OTPPopupProps {
  email: string;
  onClose: () => void;
}

const OTPPopup: React.FC<OTPPopupProps> = ({ email, onClose }) => {
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [dotCount, setDotCount] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // Focus on the first input when the component mounts
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resending) {
      interval = setInterval(() => {
        setDotCount((prev) => (prev + 1) % 4);
      }, 500);
    } else {
      setDotCount(0);
    }
    return () => clearInterval(interval);
  }, [resending]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // Allow only digits

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Move focus to the next input field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Backspace' && !otpValues[index] && index > 0) {
      const newOtpValues = [...otpValues];
      newOtpValues[index - 1] = '';
      setOtpValues(newOtpValues);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasteData = event.clipboardData.getData('Text').trim();
    if (!/^\d+$/.test(pasteData)) return; // Do nothing if the pasted data is not all digits

    const pasteValues = pasteData.slice(0, 6).split('');
    const newOtpValues = [...otpValues];

    pasteValues.forEach((char, i) => {
      newOtpValues[i] = char;
      if (inputRefs.current[i]) {
        inputRefs.current[i]!.value = char;
      }
    });

    setOtpValues(newOtpValues);
    inputRefs.current[pasteValues.length - 1]?.focus();
  };

  const handleVerifyOTP = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const token = await verifyOTP(email, otp);
      if (token) {
        localStorage.setItem('authToken', token);
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid OTP, please try again.');
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError('');
    try {
      const response = await requestOTP(email);
      if (response.ok) {
        setOtpValues(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData?.message || 'Failed to resend OTP.';
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error during OTP resend:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="popup-overlay">
      <div className="otp-popup">
        {/* Email SVG at the top */}
        <div className="email-svg">
          <img src="/assets/emailvector.svg" alt="Email Icon" />
        </div>

        {/* Send Email Component */}
        <div className="send-email-component">
          <h1>Please check your email</h1>
          <p>We've sent a code to {email}</p>
        </div>

        {/* OTP Inputs */}
        <div className="otp-inputs">
          {otpValues.map((value, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              ref={(el) => (inputRefs.current[index] = el)}
              className={
                value
                  ? 'filled'
                  : index === otpValues.findIndex((val) => val === '')
                  ? 'active'
                  : ''
              }
            />
          ))}
        </div>

        {/* Error Message */}
        <div className="error-container">
          <p className="error">{error || '\u00A0'}</p>
        </div>

        {/* Resend Code */}
        <div className="resend-code">
          <p>Didn't receive a code?</p>
          <button onClick={handleResendOTP} disabled={resending}>
            {resending ? `Sending${'.'.repeat(dotCount)}` : 'Click to resend.'}
          </button>
        </div>

        {/* Verify and Cancel Buttons */}
        <div className="verify-cancel-buttons">
          <button
            className="cancel-button"
            onClick={handleCancel}
            disabled={loading || resending}
          >
            Cancel
          </button>
          <button
            className="verify-button"
            onClick={handleVerifyOTP}
            disabled={loading || resending}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPPopup;
