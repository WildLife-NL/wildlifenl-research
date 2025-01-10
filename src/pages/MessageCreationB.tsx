import { useState, useRef} from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/MessageCreationB.css';
import { addMessage } from '../services/messageService';

const MessageCreationB: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { answerID, answerText } = location.state || {};


  // State variables for inputs
  const [messageTitle, setMessageTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [severity, setSeverity] = useState(3);

  const messageTitleRef = useRef<HTMLInputElement>(null);
  const messageTextRef = useRef<HTMLInputElement>(null);

  const severityLabels: { [key: number]: string } = {
    1: 'Debug',
    2: 'Info',
    3: 'Warning',
    4: 'Urgent',
    5: 'Critical',
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset custom validity messages
    messageTitleRef.current?.setCustomValidity('');
    messageTextRef.current?.setCustomValidity('');

    // Validate Message Title
    if (messageTitle.trim() === '') {
      messageTitleRef.current?.setCustomValidity('Message title is required.');
      isValid = false;
    }

    // Validate Message Text
    if (messageText.trim() === '') {
      messageTextRef.current?.setCustomValidity('Message text is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!isValid) {
      return;
    }

    const messageData: any = {
      name: messageTitle,
      text: messageText,
      severity: severity,
      trigger: "answer",
      answerID: answerID, 
      experimentID: id,
    };

    try {
      // Call the addMessage API
      const response = await addMessage(messageData);
      console.log('Message added successfully:', response);
      window.history.back();
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to add message. Please check your input and try again.');
    }
  };

  return (
    <div className="message-creationb-container">
      {/* Navbar */}
      <Navbar />
  
      {/* Main Container */}
      <div className="message-creationb-main-container">
        {/* Title */}
        <h1 className="message-creationb-page-title">
          New Message for answer: {answerText || 'Selected Answer'}
        </h1>
        {/* Content Box */}
        <form
          className="message-creationb-content-box"
          onSubmit={handleSubmitMessage}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          noValidate
        >
          {/* Message Title */}
          <label className="message-creationb-section-label message-creationb-title-label">
            Message Title *
          </label>
          <input
            type="text"
            className="message-creationb-text-input message-creationb-title-input"
            placeholder="Enter message title..."
            value={messageTitle}
            onChange={(e) => setMessageTitle(e.target.value)}
            required
            ref={messageTitleRef}
          />
  
          {/* Message Text */}
          <label className="message-creationb-section-label message-creationb-text-label">
            Message Text * 
          </label>
          <input
            type="text"
            className="message-creationb-text-input message-creationb-text-input"
            placeholder="Enter message text..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            required
            ref={messageTextRef}
          />

          {/* Severity */}
          <div className="message-creationb-flex-container">
            <div className="message-creationb-severity-section">
              <label className="message-creationb-section-number">1. Severity *</label>
              <div className="message-creationb-slider-input">
                <input
                  type="range"
                  id="severity"
                  min="1"
                  max="5"
                  step="1"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                />
                <span>{severity}</span>
              </div>
              <small className="severity-label">
                {severityLabels[severity]}
              </small>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="message-creationb-submit-button"
            data-testid="submit-message-button"
          >
            <img src="/assets/saveSVG.svg" alt="Submit Message" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageCreationB;
