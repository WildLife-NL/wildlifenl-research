import React, { useState} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/MessageCreation.css';
import { addMessage } from '../services/messageService';

interface Species {
  ID: string;
  name: string;
  commonName: string;
}

const MessageCreation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State variables for inputs
  const [messageTitle, setMessageTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [severity, setSeverity] = useState(1);

  const [selectedTriggerID, setSelectedTriggerID] = useState('encounter');
  const [selectedTriggerName, setSelectedTriggerName] = useState('Encounter');
  const [isTriggerDropdownOpen, setIsTriggerDropdownOpen] = useState(false);

  const [selectedSpeciesID, setSelectedSpeciesID] = useState('');
  const [selectedSpeciesName, setSelectedSpeciesName] = useState('Select Species');
  const [isSpeciesDropdownOpen, setIsSpeciesDropdownOpen] = useState(false);

  const [encounterMeters, setEncounterMeters] = useState('');
  const [encounterMinutes, setEncounterMinutes] = useState('');

  // Triggers list
  const triggers = [
    { id: 'encounter', name: 'Encounter' },
    { id: 'alarm', name: 'Alarm' },
  ];

  // Species list
  const speciesList: Species[] = [
    {
      ID: '2e6e75fb-4888-4c8d-81c6-ab31c63a7ecb',
      name: 'Bison bonasus',
      commonName: 'Wisent',
    },
    {
      ID: '79952c1b-3f43-4d6e-9ff0-b6057fda6fc1',
      name: 'Bos taurus',
      commonName: 'Schotse hooglander',
    },
    {
      ID: 'cf83db9d-dab7-4542-bc00-08c87d1da68d',
      name: 'Canis lupus',
      commonName: 'Wolf',
    },
    {
      ID: '28775ecb-1af6-4b22-a87a-e15b1999d55c',
      name: 'Sus scrofa',
      commonName: 'Wild Zwijn',
    },
  ];

  const handleSubmitMessage = async () => {
    // Validate inputs
    if (!messageTitle.trim()) {
      alert('Message title is required.');
      return;
    }

    if (!selectedTriggerID) {
      alert('Please select a valid trigger.');
      return;
    }

    if (!selectedSpeciesID) {
      alert('Please select a species.');
      return;
    }

    const messageData: any = {
      name: messageTitle,
      text: messageText,
      severity: severity,
      trigger: selectedTriggerID,
      speciesID: selectedSpeciesID,
      experimentID: id,
    };

    // Adjust fields based on trigger type
    if (selectedTriggerID === 'encounter') {
      // Convert encounterMeters and encounterMinutes to numbers
      const meters = Number(encounterMeters);
      const minutes = Number(encounterMinutes);

      if (isNaN(meters) || meters < 1) {
        alert('Encounter Meters must be a number greater than or equal to 1.');
        return;
      }

      if (isNaN(minutes) || minutes < 1) {
        alert('Encounter Minutes must be a number greater than or equal to 1.');
        return;
      }

      messageData.encounterMeters = meters;
      messageData.encounterMinutes = minutes;
    }

    try {
      // Call the addMessage API
      const response = await addMessage(messageData);
      console.log('Message added successfully:', response);
      // Redirect to the message dashboard
      navigate(`/messagedashboard/${id}`);
    } catch (error) {
      console.error('Error adding message:', error);
      alert('Failed to add message. Please check your input and try again.');
    }
  };

  return (
    <div className="message-creation-container">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="message-creation-main-container">
        {/* Title */}
        <h1 className="message-creation-page-title">New Message</h1>

        {/* Content Box */}
        <div className="message-creation-content-box">
          {/* Message Title */}
          <label className="message-creation-section-label message-creation-title-label">
            Message Title
          </label>
          <input
            type="text"
            className="message-creation-text-input message-creation-title-input"
            placeholder="Enter message title..."
            value={messageTitle}
            onChange={(e) => setMessageTitle(e.target.value)}
          />

          {/* Message Text */}
          <label className="message-creation-section-label message-creation-text-label">
            Message Text
          </label>
          <input
            type="text"
            className="message-creation-text-input message-creation-text-input"
            placeholder="Enter message text..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />

          {/* Severity, Trigger, Species, and Conditional Fields */}
          <div className="message-creation-flex-container">
            {/* Severity */}
            <div className="message-creation-severity-section">
              <label className="message-creation-section-number">1. Severity</label>
              <div className="message-creation-slider-input">
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
            </div>

            {/* Specify Trigger */}
            <div className="message-creation-trigger-section">
              <label className="message-creation-section-number">2. Specify Trigger</label>
              <div className="message-creation-trigger-content">
                <div
                  className={`message-creation-dropdown ${
                    isTriggerDropdownOpen ? 'message-creation-open' : ''
                  }`}
                >
                  <button
                    className="message-creation-dropdown-button"
                    onClick={() => setIsTriggerDropdownOpen(!isTriggerDropdownOpen)}
                  >
                    {selectedTriggerName}
                    <img
                      src="/assets/vsvg.svg"
                      alt="Dropdown Icon"
                      className="message-creation-dropdown-icon"
                    />
                  </button>
                  {isTriggerDropdownOpen && (
                    <div className="message-creation-dropdown-content">
                      {triggers.map((trigger) => (
                        <div
                          key={trigger.id}
                          className="message-creation-dropdown-item"
                          onClick={() => {
                            setSelectedTriggerID(trigger.id);
                            setSelectedTriggerName(trigger.name);
                            setIsTriggerDropdownOpen(false);
                            // Reset conditional fields
                            setEncounterMeters('');
                            setEncounterMinutes('');
                          }}
                        >
                          {trigger.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specify Species */}
            <div className="message-creation-species-section">
              <label className="message-creation-section-number">3. Species</label>
              <div className="message-creation-species-content">
                <div
                  className={`message-creation-dropdown ${
                    isSpeciesDropdownOpen ? 'message-creation-open' : ''
                  }`}
                >
                  <button
                    className="message-creation-dropdown-button"
                    onClick={() => setIsSpeciesDropdownOpen(!isSpeciesDropdownOpen)}
                  >
                    {selectedSpeciesName}
                    <img
                      src="/assets/vsvg.svg"
                      alt="Dropdown Icon"
                      className="message-creation-dropdown-icon"
                    />
                  </button>
                  {isSpeciesDropdownOpen && (
                    <div className="message-creation-dropdown-content">
                      {speciesList.map((species) => (
                        <div
                          key={species.ID}
                          className="message-creation-dropdown-item"
                          onClick={() => {
                            setSelectedSpeciesID(species.ID);
                            setSelectedSpeciesName(species.commonName);
                            setIsSpeciesDropdownOpen(false);
                          }}
                        >
                          {species.commonName} ({species.name})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conditional Fields Based on Trigger */}
            {selectedTriggerID === 'encounter' && (
              <>
                {/* Encounter Meters */}
                <div className="message-creation-encounter-meters-section">
                  <label className="message-creation-section-number">
                    4. Encounter Meters
                  </label>
                  <input
                    type="number"
                    className="message-creation-number-input"
                    placeholder="Enter meters..."
                    value={encounterMeters}
                    onChange={(e) => setEncounterMeters(e.target.value)}
                    min="1"
                  />
                </div>

                {/* Encounter Minutes */}
                <div className="message-creation-encounter-minutes-section">
                  <label className="message-creation-section-number">
                    5. Encounter Minutes
                  </label>
                  <input
                    type="number"
                    className="message-creation-number-input"
                    placeholder="Enter minutes..."
                    value={encounterMinutes}
                    onChange={(e) => setEncounterMinutes(e.target.value)}
                    min="1"
                  />
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
            className="message-creation-submit-button"
            onClick={handleSubmitMessage}
            data-testid="submit-message-button"
          >
            <img src="/assets/saveSVG.svg" alt="Submit Message" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageCreation;
