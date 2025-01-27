import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/ExperimentCreation.css';
import { getAllLivingLabs } from '../services/livingLabService';
import { addExperiment } from '../services/experimentService';
import { LivingLab } from '../types/livinglab';

const ExperimentCreation: React.FC = () => {
  // State variables for inputs
  const [experimentTitle, setExperimentTitle] = useState('');
  const [experimentDescription, setExperimentDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLivingLabID, setSelectedLivingLabID] = useState('');
  const [selectedLivingLabName, setSelectedLivingLabName] = useState('None');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // State variable for living labs
  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  // Initialize navigate function
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLivingLabs = async () => {
      try {
        const labs = await getAllLivingLabs();
        setLivingLabs(labs);
      } catch (error) {
        console.error('Failed to fetch living labs:', error);
      } finally {
        setLoadingLabs(false);
      }
    };
    fetchLivingLabs();
  }, []);

  const handleSubmitExperiment = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
  
    // Perform custom validation
    const isValid = validateDates();
  
    // Trigger native validation messages
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
  
    if (!isValid) {
      return;
    }
  
    const formattedStartDate = new Date(startDate).toISOString();
    const formattedEndDate = endDate ? new Date(endDate).toISOString() : null;
  
    const experimentData = {
      name: experimentTitle,
      description: experimentDescription,
      start: formattedStartDate,
      ...(formattedEndDate && { end: formattedEndDate }),
      ...(selectedLivingLabID && { livingLabID: selectedLivingLabID }),
    };
  
    try {
      // Call the addExperiment API
      const response = await addExperiment(experimentData);
      console.log('Experiment added successfully:', response);
      // Redirect to the dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding experiment:', error);
    }
  };

  const validateDates = (): boolean => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
  
    let isValid = true;
  
    // Reset custom validity
    if (startDateRef.current) {
      startDateRef.current.setCustomValidity('');
    }
    if (endDateRef.current) {
      endDateRef.current.setCustomValidity('');
    }
  
    // Validate Start Date
    if (start < now) {
      if (startDateRef.current) {
        startDateRef.current.setCustomValidity('Start date cannot be in the past.');
      }
      isValid = false;
    }
  
    // Validate End Date
    if (endDate) {
      if (end && end <= start) {
        if (endDateRef.current) {
          endDateRef.current.setCustomValidity('End date must be later than start date.');
        }
        isValid = false;
      }
    }
  
    return isValid;
  };


  return (
    <div className="experiment-creation-container">
      {/* Navbar */}
      <Navbar />
  
      {/* Main Container */}
      <div className="experiment-creation-main-container">
        {/* Title */}
        <h1 className="experiment-creation-page-title">New Experiment</h1>
  
        {/* Content Box */}
        <form className="experiment-creation-content-box" onSubmit={handleSubmitExperiment} noValidate>
          {/* Experiment Title */}
          <label className="experiment-creation-section-label experiment-creation-title-label">
            Experiment Title
          </label>
          <input
            type="text"
            className="experiment-creation-text-input experiment-creation-title-input"
            placeholder="Enter experiment title..."
            value={experimentTitle}
            onChange={(e) => setExperimentTitle(e.target.value)}
            required
          />
  
          {/* Description */}
          <label className="experiment-creation-section-label experiment-creation-description-label">
            Description
          </label>
          <textarea
            className="experiment-creation-text-input experiment-creation-description-input"
            placeholder="Enter experiment description..."
            value={experimentDescription}
            onChange={(e) => setExperimentDescription(e.target.value)}
            required
          />
  
          {/* Duration and LivingLab Sections */}
          <div className="experiment-creation-flex-container">
            {/* Duration of Experiment */}
            <div className="experiment-creation-duration-section">
              <label className="experiment-creation-section-number">
                1. Duration of experiment
              </label>
              <div className="experiment-creation-date-inputs">
                <div className="experiment-creation-date-input">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      validateDates();
                    }}
                    ref={startDateRef}
                    required
                  />
                </div>
                <span className="experiment-creation-date-separator">-</span>
                <div className="experiment-creation-date-input">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      validateDates();
                    }}
                    ref={endDateRef}
                  />
                </div>
              </div>
            </div>
  
            {/* Specify LivingLab */}
            <div className="experiment-creation-livinglab-section">
              <label className="experiment-creation-section-number">
                2. Specify LivingLab
              </label>
              <div className="experiment-creation-livinglab-content">
                <label className="experiment-creation-livinglab-label">
                  LivingLab:
                </label>
                <div
                  className={`experiment-creation-dropdown ${
                    isDropdownOpen ? 'experiment-creation-open' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="experiment-creation-dropdown-button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {selectedLivingLabName}
                    <img
                      src="/assets/vsvg.svg"
                      alt="Dropdown Icon"
                      className="experiment-creation-dropdown-icon"
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="experiment-creation-dropdown-content">
                      {loadingLabs ? (
                        <div>Loading...</div>
                      ) : (
                        <>
                          {/* "All" Option */}
                          <div
                            className="experiment-creation-dropdown-item"
                            onClick={() => {
                              setSelectedLivingLabID(''); // Empty string represents 'None'
                              setSelectedLivingLabName('None');
                              setIsDropdownOpen(false);
                            }}
                          >
                            None
                          </div>
                          {/* LivingLab Options */}
                          {livingLabs.map((lab) => (
                            <div
                              key={lab.ID}
                              className="experiment-creation-dropdown-item"
                              onClick={() => {
                                setSelectedLivingLabID(lab.ID);
                                setSelectedLivingLabName(lab.name);
                                setIsDropdownOpen(false);
                              }}
                            >
                              {lab.name}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
  
          {/* Submit Button */}
          <button
            type="submit"
            className="experiment-creation-submit-button"
            data-testid="submit-experiment-button"
            title="Submit experiment"
          >
            <img src="/assets/saveSVG.svg" alt="Submit Experiment" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ExperimentCreation;