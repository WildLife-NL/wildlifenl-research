import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import '../styles/Message.css';
import { Message as MessageType } from '../types/message';

const Message: React.FC = () => {
  const location = useLocation();
  const message = location.state?.message as MessageType | null;

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

  return (
    <>
      <Navbar />
      <div className="message-container">
        {/* Title */}
        <h1 className="message-view-title">Message View</h1>

        {/* Message Details Component */}
        <div className="message-details-component">
          <DynamicView fields={fields} />
        </div>
      </div>
    </>
  );
};

export default Message;
