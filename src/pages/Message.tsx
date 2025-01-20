import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import '../styles/Message.css';
import { Message as MessageType } from '../types/message';
import { DeleteMessageByID } from '../services/messageService';
import ConfirmationPopup from '../components/ConfirmationPopup';
import { useState } from 'react';
import { User } from '../types/user'; // Import User

const Message: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const message = location.state?.message as MessageType | null;
  const loggedInUser: User | undefined = location.state?.user; // Add loggedInUser

  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  if (!message) {
    return (
      <>
        <Navbar />
        <div className="message-not-found">
          <p>Message not found.</p>
        </div>
      </>
    );
  }

  // Define severity labels
  const severityLabels: { [key: number]: string } = {
    1: 'debug',
    2: 'info',
    3: 'warning',
    4: 'urgent',
    5: 'critical',
  };

  // Prepare fields to display
  const fields = [
    { name: 'Message Name', value: message.name },
    { name: 'Text', value: message.text },
    { name: 'Trigger', value: message.trigger },
    {
      name: 'Severity',
      value: severityLabels[message.severity] || 'Unknown',
    },
    {
      name: 'Encounter Meters',
      value:
        message.encounterMeters !== undefined
          ? message.encounterMeters.toString()
          : 'N/A',
    },
    {
      name: 'Encounter Minutes',
      value:
        message.encounterMinutes !== undefined
          ? message.encounterMinutes.toString()
          : 'N/A',
    },
    {
      name: 'Species',
      value:
        message.species !== undefined
          ? `${message.species.commonName} (${message.species.name})`
          : 'N/A',
    },
    {
      name: 'Activity',
      value: message.activity.toString(),
    },
    {
      name: 'Experiment',
      value: message.experiment.name || 'N/A',
    },
  ];

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to get experiment status
  const getStatus = (startDate: string, endDate?: string | null): string => {
    const today = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    if (start > today) {
      return 'Upcoming';
    } else if (end && end < today) {
      return 'Completed';
    } else {
      return 'Live';
    }
  };

  const status = message.experiment
    ? getStatus(message.experiment.start, message.experiment.end)
    : 'Unknown';

  const isCreator = loggedInUser?.ID === message?.experiment?.user.ID; // Define isCreator

  // Show confirmation popup
  const handleDeleteMessage = () => {
    setConfirmationMessage('Are you sure you want to delete this message?');
    setOnConfirmAction(() => confirmDeleteMessage);
    setIsConfirmationVisible(true);
  };

  // Actual delete action
  const confirmDeleteMessage = async () => {
    if (!message) return;
    try {
      await DeleteMessageByID(message.ID);
      navigate(-1);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete the message. Please try again.');
    }
  };

  const cancelAction = () => {
    setIsConfirmationVisible(false);
    setConfirmationMessage('');
    setOnConfirmAction(null);
  };

  return (
    <>
      <Navbar />
      <div className="message-container">
        {/* Title */}
        <h1 className="message-view-title">
          View for Message: {truncateText(message?.name || `Message ${message.ID}`, 23)}
        </h1>

        {/* Message Details */}
        <div className="message-details-component">
          <DynamicView fields={fields} />
        </div>

        {/* Delete Button */}
        <button
          className={`delete-message-button ${
            status === 'Upcoming' && isCreator ? 'delete-message-red-button' : 'delete-message-gray-button'
          }`}
          onClick={status === 'Upcoming' && isCreator ? handleDeleteMessage : undefined}
          disabled={status !== 'Upcoming' || !isCreator}
          title={
            !isCreator
              ? 'Messages can only be deleted by the creator of the experiment before it goes live'
              : status !== 'Upcoming'
              ? 'Messages can only be deleted before the experiment goes live'
              : ''
          }
          data-testid="delete-message-button"
        >
          <span>Delete Message</span>
          <img
            src="/assets/TrashSVG.svg"
            alt="Delete Icon"
            className="delete-message-button-icon"
          />
        </button>
      </div>

      {/* Confirmation Popup */}
      {isConfirmationVisible && (
        <ConfirmationPopup
          message={confirmationMessage}
          onConfirm={onConfirmAction!}
          onCancel={cancelAction}
        />
      )}
    </>
  );
};

export default Message;
