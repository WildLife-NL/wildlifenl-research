import React, { useRef, useEffect, useState } from 'react';
import '../styles/ConfirmationPopup.css'; // Ensure the path is correct

interface ConfirmationPopupProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ message, onConfirm, onCancel }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger the show animation
    setShow(true);

    const handleOutsideClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShow(false);
        setTimeout(() => {
          onCancel();
        }, 300); // Match the CSS transition duration
      }
    };

    // Add event listener for clicks
    document.addEventListener('mousedown', handleOutsideClick);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onCancel]);

  const handleConfirm = () => {
    setShow(false);
    setTimeout(() => {
      onConfirm();
    }, 300);
  };

  const handleCancel = () => {
    setShow(false);
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  return (
    <div className={`confirmation-popup-overlay ${show ? 'show' : ''}`}>
      <div className="confirmation-popup-content" ref={popupRef}>
        <h2 id="confirmation-popup-title">Confirmation</h2>
        <p>{message}</p>
        <div className="confirmation-popup-actions">
          <button className="confirmation-popup-btn confirmation-popup-btn-yes" onClick={handleConfirm}>
            Yes
          </button>
          <button className="confirmation-popup-btn confirmation-popup-btn-no" onClick={handleCancel}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPopup;
