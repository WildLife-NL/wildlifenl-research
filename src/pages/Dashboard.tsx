import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/Dashboard.css';

// Import API functions
import { getAllLivingLabs } from '../services/livingLabService';
import { getMyExperiments } from '../services/experimentService';

// Import types
import { Experiment } from '../types/experiment';
import { LivingLab } from '../types/livinglab';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>([]);
  const [selectedLivingLab, setSelectedLivingLab] = useState<string>('All LivingLabs');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Experiment; direction: string } | null>(null);

  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State for dropdown open/close
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch living labs and experiments on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true); // Start loading

        // Fetch Living Labs and Experiments in parallel
        const [labs, exps] = await Promise.all([getAllLivingLabs(), getMyExperiments()]);

        // Include 'All LivingLabs' as default option
        const allLivingLabsOption: LivingLab = {
          ID: 'all',
          name: 'All LivingLabs',
          definition: [],
          $schema: '',
        };
        setLivingLabs([allLivingLabsOption, ...labs]);

         // Calculate responses for each experiment
        const experimentsWithResponses = exps.map((exp) => ({
          ...exp,
          responses: (exp.messageActivity ?? 0) + (exp.questionnaireActivity ?? 0),
        }));

        // Set experiments and filtered experiments
        setExperiments(experimentsWithResponses);
        setFilteredExperiments(experimentsWithResponses);

        setIsLoading(false); // Finish loading
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false); // Finish loading even if error
      }
    };
    fetchData();
  }, []);

  // Apply filters whenever filter state changes
  useEffect(() => {
    let filtered = [...experiments];

    // Filter by LivingLab
    if (selectedLivingLab !== 'All LivingLabs') {
      filtered = filtered.filter((exp) => exp.livingLab?.name === selectedLivingLab);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((exp) => new Date(exp.start) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((exp) => new Date(exp.end) <= new Date(endDate));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((exp) =>
        exp.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'livingLab':
            aValue = a.livingLab?.name || '';
            bValue = b.livingLab?.name || '';
            break;
          case 'start':
          case 'end':
            aValue = new Date(a[sortConfig.key]).getTime() || 0;
            bValue = new Date(b[sortConfig.key]).getTime() || 0;
            break;
          case 'responses':
            aValue = (a.messageActivity ?? 0) + (a.questionnaireActivity ?? 0);
            bValue = (b.messageActivity ?? 0) + (b.questionnaireActivity ?? 0);
            break;
          case 'numberOfQuestionnaires':
          case 'numberOfMessages':
            aValue = a[sortConfig.key] ?? 0;
            bValue = b[sortConfig.key] ?? 0;
            break;
          default:
            aValue = a[sortConfig.key] || '';
            bValue = b[sortConfig.key] || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredExperiments(filtered);
  }, [selectedLivingLab, startDate, endDate, searchQuery, sortConfig, experiments]);

  // Handle sorting
  const requestSort = (key: keyof Experiment) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Function to get sort icon class
  const getSortIconClass = (columnKey: keyof Experiment) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'ascending' ? 'sort-ascending' : 'sort-descending';
    }
    return '';
  };

  // Handle navigation to create experiment page
  const navigateToCreateExperiment = () => {
    navigate('/experimentcreation');
  };

  // Handle navigation to experiment details page
  const handleExperimentClick = (experiment: Experiment) => {
    navigate(`/experiment/${experiment.ID}`, { state: { experiment } });
  };

  return (
    <div className="dashboard-container" data-testid="dashboard-container">
      {/* Navbar */}
      <Navbar />

      {/* Experiments Title */}
      <h1 className="experiments-title" data-testid="experiments-title">
        My Experiments
      </h1>

      {/* Filters Container */}
      <div className="filters-container" data-testid="filters-container">
        {/* LivingLab Filter */}
        <div className="filter livinglab-filter" data-testid="livinglab-filter">
          <label className="filter-label">Filter by LivingLab:</label>
          <div
            className={`dropdown ${isDropdownOpen ? 'open' : ''}`}
          >
            <button
              className="dropdown-button"
              data-testid="livinglab-dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {selectedLivingLab}
              <img
                src="/assets/vsvg.svg"
                alt="Dropdown Icon"
                className={`dropdown-icon ${isDropdownOpen ? 'dropdown-icon-hover' : ''}`}
              />
            </button>
            <div className="dropdown-content" data-testid="livinglab-dropdown-content">
              {livingLabs.map((lab) => (
                <div
                  key={lab.ID}
                  data-testid={`livinglab-option-${lab.ID}`}
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedLivingLab(lab.name);
                    setIsDropdownOpen(false);
                  }}
                >
                  {lab.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="filter date-filter" data-testid="date-filter">
          <label className="filter-label">Filter by date range:</label>
          <div className="date-inputs">
            <div className="date-input">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="start-date-input"
              />
            </div>
            <span className="date-separator">-</span>
            <div className="date-input">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="end-date-input"
              />
            </div>
          </div>
        </div>

        {/* Search Filter */}
        <div className="filter search-filter" data-testid="search-filter">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search experiment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
            <img src="/assets/SearchSVG.svg" alt="Search Icon" className="search-icon" />
          </div>
        </div>
      </div>

      {/* Loading Animation or Experiments Table */}
      {isLoading ? (
        <div className="loading-container" data-testid="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Experiments Table */}
          <div className="table-container" data-testid="table-container">
            <table
              className="experiments-table"
              data-testid="experiments-table"
            >
              <thead>
                <tr>
                  <th onClick={() => requestSort('livingLab')}>
                    LivingLab
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('livingLab')}`}
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
                  <th onClick={() => requestSort('numberOfQuestionnaires')}>
                    Questionnaires
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('numberOfQuestionnaires')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('numberOfMessages')}>
                    Messages
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('numberOfMessages')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('start')}>
                    Date Range
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('start')}`}
                    />
                  </th>
                  <th>Status</th>
                  <th onClick={() => requestSort('responses')}>
                    Responses
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('responses')}`}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExperiments.map((exp, index) => {
                  const status = getStatus(exp.start, exp.end);
                  return (
                    <tr
                      key={exp.ID}
                      data-testid={`experiment-row-${exp.ID}`}
                      className={index % 2 === 0 ? 'row-even' : 'row-odd'}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={() => handleExperimentClick(exp)}>
                        {exp.livingLab?.name || 'All LivingLabs'}
                      </td>
                      <td
                        data-testid="experiment-name"
                        onClick={() => handleExperimentClick(exp)}
                      >
                        {exp.name}
                      </td>
                      <td onClick={() => handleExperimentClick(exp)}>
                        {exp.numberOfQuestionnaires}
                      </td>
                      <td onClick={() => handleExperimentClick(exp)}>
                        {exp.numberOfMessages}
                      </td>
                      <td onClick={() => handleExperimentClick(exp)}>
                      {formatDate(exp.start)} - {exp.end ? formatDate(exp.end) : 'No End Date'}
                      </td>
                      <td onClick={() => handleExperimentClick(exp)}>{status}</td>
                      <td onClick={() => handleExperimentClick(exp)}>
                        {exp.responses}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Experiment Button */}
          <button
            className="add-experiment-button"
            onClick={navigateToCreateExperiment}
            data-testid="add-experiment-button"
          >
            <img src="/assets/AddButtonSVG.svg" alt="Add Experiment" />
          </button>
        </>
      )}
    </div>
  );
};

// Function to determine the status based on date range
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

const formatDate = (dateString: string): string => {
  if (!dateString) return 'No Date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleDateString();
};

export default Dashboard;
