import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/MessageDashboard.css';
import { getMessagesByExperimentID } from '../services/messageService';
import { Species } from '../types/species';

// Import types
import { Message } from '../types/message';
import { Experiment } from '../types/experiment';

interface TriggerType {
  ID: string;
  name: string;
}

const MessageDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const severityLabels: { [key: number]: string } = {
    1: 'debug',
    2: 'info',
    3: 'warning',
    4: 'urgent',
    5: 'critical',
  };

  const [interactionTypes, setInteractionTypes] = useState<TriggerType[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [experiment] = useState<Experiment | null>(null);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedTriggerType, setSelectedInteractionType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Message; direction: string } | null>(null);
  const [showEncounterMeters, setShowEncounterMeters] = useState<boolean>(false);
  const [showEncounterMinutes, setShowEncounterMinutes] = useState<boolean>(false);

  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State for dropdown open/close
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const fetchedMessages = await getMessagesByExperimentID(id);
        setMessages(fetchedMessages);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [id]);

  // Fetch interaction types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Extract unique interaction types from messages
        const interactionTypesSet = new Set<string>();
        messages.forEach((msg: Message) => {
          if (msg.trigger) {
            interactionTypesSet.add(msg.trigger);
          }
        });

        // Include 'All TriggerTypes' as default option
        const allTriggerTypesOption: TriggerType = {
          ID: 'all',
          name: 'All',
        };

        const interactionTypesData = Array.from(interactionTypesSet).map((type) => ({
          ID: type,
          name: type,
        }));


        setInteractionTypes([allTriggerTypesOption, ...interactionTypesData]);

        setFilteredMessages(messages);

        setIsLoading(false);

      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [messages]);

  useEffect(() => {
    setShowEncounterMeters(
      filteredMessages.some(
        (msg) => msg.encounterMeters != null && msg.encounterMeters > 0
      )
    );
  
    setShowEncounterMinutes(
      filteredMessages.some(
        (msg) => msg.encounterMinutes != null && msg.encounterMinutes > 0
      )
    );
  }, [filteredMessages]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    let filtered = [...messages];

    // Filter by TriggerType
    if (selectedTriggerType !== 'All') {
      filtered = filtered.filter((msg: Message) => msg.trigger === selectedTriggerType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((msg: Message) =>
        msg.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a: Message, b: Message) => {
        let aValue: any = a[sortConfig.key] || '';
        let bValue: any = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredMessages(filtered);
  }, [selectedTriggerType, searchQuery, sortConfig, messages]);

  // Handle sorting
  const requestSort = (key: keyof Message) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Function to get sort icon class
  const getSortIconClass = (columnKey: keyof Message) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'ascending' ? 'sort-ascending' : 'sort-descending';
    }
    return '';
  };

  // Handle navigation to create message page
  const navigateToCreateMessage = () => {
    navigate(`/messagecreation/${id}`);
  };

  // Handle navigation to message details page
  const handleMessageClick = (message: Message) => {
    navigate(`/message/${message.answerID}`, { state: { message } });
  };

  // Function to truncate text to a specified length
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="message-dashboard-container" data-testid="message-dashboard-container">
      {/* Navbar */}
      <Navbar />

      {/* Messages Title */}
      <h1 className="messages-title" data-testid="messages-title">
      Messages for Experiment: {truncateText(experiment?.name || `Experiment ${id}`, 35)}
      </h1>

      {/* Filters Container */}
      <div className="message-filters-container" data-testid="filters-container">
        {/* TriggerType Filter */}
        <div className="message-filter interactiontype-filter" data-testid="interactiontype-filter">
          <label className="filter-label">Filter by trigger:</label>
          <div
            className={`dropdown ${isDropdownOpen ? 'open' : ''}`}
          >
            <button
              className="dropdown-button"
              data-testid="interactiontype-dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {selectedTriggerType}
              <img
                src="/assets/vsvg.svg"
                alt="Dropdown Icon"
                className={`dropdown-icon ${isDropdownOpen ? 'dropdown-icon-hover' : ''}`}
              />
            </button>
            <div className="dropdown-content" data-testid="interactiontype-dropdown-content">
              {interactionTypes.map((type) => (
                <div
                  key={type.ID}
                  data-testid={`interactiontype-option-${type.ID}`}
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedInteractionType(type.name);
                    setIsDropdownOpen(false);
                  }}
                >
                  {type.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search Filter */}
        <div className="message-filter search-filter" data-testid="search-filter">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
            <img src="/assets/SearchSVG.svg" alt="Search Icon" className="search-icon" />
          </div>
        </div>
      </div>

      {/* Loading Animation or Messages Table */}
      {isLoading ? (
        <div className="loading-container" data-testid="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Messages Table */}
          <div className="message-table-container" data-testid="table-container">
            <table
              className="messages-table"
              data-testid="messages-table"
            >
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')}>
                    Name
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('name')}`}
                    />
                  </th>
                  <th>
                    Species
                  </th>
                  <th onClick={() => requestSort('trigger')}>
                    Trigger
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('trigger')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('text')}>
                    Text
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('text')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('severity')}>
                    Severity
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('severity')}`}
                    />
                  </th>
                  {showEncounterMeters && (
                    <th onClick={() => requestSort('encounterMeters')}>
                      Encounter Meters
                      <img
                        src="/assets/vblacksvg.svg"
                        alt="Sort Icon"
                        className={`sort-icon ${getSortIconClass('encounterMeters')}`}
                      />
                    </th>
                  )}
                  {showEncounterMinutes && (
                    <th onClick={() => requestSort('encounterMinutes')}>
                      Encounter Minutes
                      <img
                        src="/assets/vblacksvg.svg"
                        alt="Sort Icon"
                        className={`sort-icon ${getSortIconClass('encounterMinutes')}`}
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg: Message, index: number) => {
                  return (
                    <tr
                      key={msg.answerID}
                      data-testid={`message-row-${msg.answerID}`}
                      className={index % 2 === 0 ? 'row-even' : 'row-odd'}
                      style={{ cursor: 'pointer' }}
                    >
                      <td
                        data-testid="message-name"
                        onClick={() => handleMessageClick(msg)}
                      >
                        {truncateText(msg.name, 20)}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.species
                          ? `${msg.species.commonName} (${msg.species.name})`
                          : 'Unknown Species'}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.trigger}
                      </td>
                      
                      <td onClick={() => handleMessageClick(msg)}>
                        {truncateText(msg.text, 12)}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {severityLabels[msg.severity] || 'Unknown'}
                      </td>
                      {showEncounterMeters && (
        <td onClick={() => handleMessageClick(msg)}>
          {msg.encounterMeters}
        </td>
      )}
      {showEncounterMinutes && (
        <td onClick={() => handleMessageClick(msg)}>
          {msg.encounterMinutes}
        </td>
      )}
    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Message Button */}
          <button
            className="add-message-button"
            onClick={navigateToCreateMessage}
            data-testid="add-message-button"
          >
            <img src="/assets/AddButtonSVG.svg" alt="Add Message" />
          </button>
        </>
      )}
    </div>
  );
};

export default MessageDashboard;
