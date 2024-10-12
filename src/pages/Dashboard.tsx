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

  // State for checkboxes
  const [selectedExperiments, setSelectedExperiments] = useState<{ [key: string]: boolean }>({});
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // State for loading
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

        // Initialize selected experiments state
        const initialSelected = exps.reduce((acc, exp) => {
          acc[exp.ID] = false;
          return acc;
        }, {} as { [key: string]: boolean });

        setSelectedExperiments(initialSelected);

        // Set experiments and filtered experiments
        setExperiments(exps);
        setFilteredExperiments(exps);

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
          case 'user':
            aValue = a.user?.name || '';
            bValue = b.user?.name || '';
            break;
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
          case 'questionnaires':
          case 'messages':
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
  const handleExperimentClick = (experimentID: string) => {
    navigate(`/experiment/${experimentID}`);
  };

  // Handle checkbox change
  const handleCheckboxChange = (experimentID: string) => {
    setSelectedExperiments((prevSelected) => {
      const newSelected = {
        ...prevSelected,
        [experimentID]: !prevSelected[experimentID],
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
    setSelectedExperiments((prevSelected) => {
      const newSelected = { ...prevSelected };
      Object.keys(newSelected).forEach((key) => {
        newSelected[key] = newSelectAll;
      });
      return newSelected;
    });
  };

  // State for dropdown hover
  const [isDropdownHovered, setIsDropdownHovered] = useState(false);

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <Navbar />

      {/* Experiments Title */}
      <h1 className="experiments-title">Experiments</h1>

      {/* Filters Container */}
      <div className="filters-container">
        {/* LivingLab Filter */}
        <div className="filter livinglab-filter">
          <label className="filter-label">Filter by LivingLab:</label>
          <div
            className="dropdown"
            onMouseEnter={() => setIsDropdownHovered(true)}
            onMouseLeave={() => setIsDropdownHovered(false)}
          >
            <button className="dropdown-button">
              {selectedLivingLab}
              <img
                src="/assets/vsvg.svg"
                alt="Dropdown Icon"
                className={`dropdown-icon ${isDropdownHovered ? 'dropdown-icon-hover' : ''}`}
              />
            </button>
            <div className="dropdown-content">
              {livingLabs.map((lab) => (
                <div
                  key={lab.ID}
                  className="dropdown-item"
                  onClick={() => setSelectedLivingLab(lab.name)}
                >
                  {lab.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="filter date-filter">
          <label className="filter-label">Filter by date range:</label>
          <div className="date-inputs">
            <div className="date-input">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="date-separator">-</span>
            <div className="date-input">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Search Filter */}
        <div className="filter search-filter">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search experiment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <img src="/assets/SearchSVG.svg" alt="Search Icon" className="search-icon" />
          </div>
        </div>
      </div>

      {/* Loading Animation or Experiments Table */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Experiments Table */}
          <div className="table-container">
            <table className="experiments-table">
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
                    Experiment
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('name')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('questionnaires')}>
                    Questionnaires
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('questionnaires')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('messages')}>
                    Messages
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('messages')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('user')}>
                    Creator
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('user')}`}
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
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAllChange}
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
                      className={index % 2 === 0 ? 'row-even' : 'row-odd'}
                      // Removed onClick from the entire row to allow checkbox clicks
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={() => handleExperimentClick(exp.ID)}>
                        {exp.livingLab?.name || 'All LivingLabs'}
                      </td>
                      <td onClick={() => handleExperimentClick(exp.ID)}>{exp.name}</td>
                      <td onClick={() => handleExperimentClick(exp.ID)}>{exp.questionnaires}</td>
                      <td onClick={() => handleExperimentClick(exp.ID)}>{exp.messages}</td>
                      <td onClick={() => handleExperimentClick(exp.ID)}>{exp.user?.name || 'N/A'}</td>
                      <td onClick={() => handleExperimentClick(exp.ID)}>
                        {new Date(exp.start).toLocaleDateString()} -{' '}
                        {new Date(exp.end).toLocaleDateString()}
                      </td>
                      <td onClick={() => handleExperimentClick(exp.ID)}>{status}</td>
                      <td onClick={() => handleExperimentClick(exp.ID)}>{exp.responses}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedExperiments[exp.ID] || false}
                          onChange={() => handleCheckboxChange(exp.ID)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Experiment Button */}
          <button className="add-experiment-button" onClick={navigateToCreateExperiment}>
            <img src="/assets/AddButtonSVG.svg" alt="Add Experiment" />
          </button>
        </>
      )}
    </div>
  );
};

// Function to determine the status based on date range
const getStatus = (startDate: string, endDate: string): string => {
  const today = new Date();
  if (new Date(startDate) > today) {
    return 'Upcoming';
  } else if (new Date(endDate) < today) {
    return 'Completed';
  } else {
    return 'Live';
  }
};

export default Dashboard;
