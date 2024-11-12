import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/MessageDashboard.css';

// Import types
import { Message } from '../types/message';

interface InteractionType {
  ID: string;
  name: string;
}

const MessageDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  const { messages = [], experiment } = location.state || {};

  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedInteractionType, setSelectedInteractionType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Message; direction: string } | null>(null);

  // State for checkboxes
  const [selectedMessages, setSelectedMessages] = useState<{ [key: string]: boolean }>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State for dropdown open/close
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch interaction types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Initialize selected messages state
        const initialSelected = messages.reduce((acc: { [key: string]: boolean }, msg: Message) => {
          acc[msg.answerID] = false;
          return acc;
        }, {} as { [key: string]: boolean });

        setSelectedMessages(initialSelected);

        // Extract unique interaction types from messages
        const interactionTypesSet = new Set<string>();
        messages.forEach((msg: Message) => {
          if (msg.trigger) {
            interactionTypesSet.add(msg.trigger);
          }
        });

        const interactionTypesData = Array.from(interactionTypesSet).map((type) => ({
          ID: type,
          name: type,
        }));

        // Include 'All InteractionTypes' as default option
        const allInteractionTypesOption: InteractionType = {
          ID: 'all',
          name: 'All',
        };

        setInteractionTypes([allInteractionTypesOption, ...interactionTypesData]);

        setFilteredMessages(messages);

        setIsLoading(false);

      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [messages]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    let filtered = [...messages];

    // Filter by InteractionType
    if (selectedInteractionType !== 'All') {
      filtered = filtered.filter((msg: Message) => msg.trigger === selectedInteractionType);
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
  }, [selectedInteractionType, searchQuery, sortConfig, messages]);

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

  // Handle checkbox change
  const handleCheckboxChange = (messageID: string) => {
    setSelectedMessages((prevSelected) => {
      const newSelected = {
        ...prevSelected,
        [messageID]: !prevSelected[messageID],
      };
      const allSelected = Object.values(newSelected).every((selected) => selected);
      setSelectAll(allSelected);
      return newSelected;
    });
  };

  // Handle select all checkbox change
  const handleSelectAllChange = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setSelectedMessages((prevSelected) => {
      const newSelected = { ...prevSelected };
      Object.keys(newSelected).forEach((key) => {
        newSelected[key] = newSelectAll;
      });
      return newSelected;
    });
  };

  return (
    <div className="message-dashboard-container" data-testid="message-dashboard-container">
      {/* Navbar */}
      <Navbar />

      {/* Messages Title */}
      <h1 className="messages-title" data-testid="messages-title">
      Messages for Experiment: {experiment?.name || `Experiment ${id}`}
      </h1>

      {/* Filters Container */}
      <div className="message-filters-container" data-testid="filters-container">
        {/* InteractionType Filter */}
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
              {selectedInteractionType}
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
                  <th onClick={() => requestSort('trigger')}>
                    Interaction
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('trigger')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('name')}>
                    Name
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('name')}`}
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
                  <th onClick={() => requestSort('encounterMeters')}>
                    Encounter Meters
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('encounterMeters')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('encounterMinutes')}>
                    Encounter Minutes
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('encounterMinutes')}`}
                    />
                  </th>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAllChange}
                      data-testid="select-all-checkbox"
                    />
                  </th>
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
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.trigger}
                      </td>
                      <td
                        data-testid="message-name"
                        onClick={() => handleMessageClick(msg)}
                      >
                        {msg.name}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.text}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.severity}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.encounterMeters}
                      </td>
                      <td onClick={() => handleMessageClick(msg)}>
                        {msg.encounterMinutes}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedMessages[msg.answerID] || false}
                          onChange={() => handleCheckboxChange(msg.answerID)}
                          data-testid={`message-checkbox-${msg.answerID}`}
                        />
                      </td>
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
