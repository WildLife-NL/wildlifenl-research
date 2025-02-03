import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/QuestionnaireDashboard.css';
import { Questionnaire } from '../types/questionnaire';
import { getQuestionnaireByExperimentID } from '../services/questionnaireService';
import { Experiment } from '../types/experiment';
import { getAllInteractions } from '../services/interactionTypeService';
import { InteractionType } from '../types/interactiontype';
import { User } from '../types/user';

const QuestionnaireDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const experiment = location.state?.experiment as Experiment | null;
  const [filteredQuestionnaires, setFilteredQuestionnaires] = useState<Questionnaire[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Interaction Type Filter State
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]);
  const [selectedInteractionType, setSelectedInteractionType] = useState<string>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Sorting State
  type SortKey = keyof Questionnaire | 'numberOfQuestions';
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: string } | null>(null);

  // Add retrieval of loggedInUser from location state
  const loggedInUser = location.state?.user as User | undefined;

  // Determine if the logged-in user is the creator of the experiment
  const isCreator = loggedInUser?.ID === experiment?.user?.ID;

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const fetchedQuestionnaires = await getQuestionnaireByExperimentID(id);

        // Process the data to ensure interactionType and questions are defined
        const processedQuestionnaires = fetchedQuestionnaires.map((questionnaire) => ({
          ...questionnaire,
          interactionType: questionnaire.interactionType || { name: 'Unknown' },
          questions: questionnaire.questions || [],
        }));

        setQuestionnaires(processedQuestionnaires);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching questionnaires:', error);
        setIsLoading(false);
      }
    };

    fetchQuestionnaires();
  }, [id]);

  // Fetch Interaction Types for the Filter
  useEffect(() => {
    const fetchInteractionTypes = async () => {
      try {
        const types = await getAllInteractions();
        setInteractionTypes(types);
      } catch (error) {
        console.error('Failed to fetch interaction types:', error);
      }
    };
    fetchInteractionTypes();
  }, []);

  useEffect(() => {
    let filtered = [...questionnaires];

    // Filter by Interaction Type
    if (selectedInteractionType !== 'All') {
      filtered = filtered.filter((q: Questionnaire) =>
        q.interactionType?.name === selectedInteractionType
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((q: Questionnaire) =>
        q.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a: Questionnaire, b: Questionnaire) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'numberOfQuestions') {
          aValue = a.questions ? a.questions.length : 0;
          bValue = b.questions ? b.questions.length : 0;
        } else if (sortConfig.key === 'interactionType') {
          aValue = a.interactionType?.name || '';
          bValue = b.interactionType?.name || '';
        } else {
          aValue = a[sortConfig.key] || '';
          bValue = b[sortConfig.key] || '';
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
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

    setFilteredQuestionnaires(filtered);
  }, [searchQuery, sortConfig, questionnaires, selectedInteractionType]);

  const requestSort = (key: SortKey) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIconClass = (columnKey: SortKey) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'ascending' ? 'sort-ascending' : 'sort-descending';
    }
    return '';
  };

  // Update the navigateToCreateQuestionnaire function to pass loggedInUser
  const navigateToCreateQuestionnaire = () => {
    navigate(`/questionnairecreation/${id}`, { state: { experiment, user: loggedInUser } });
  };

  // Update the handleQuestionnaireClick function to pass loggedInUser
  const handleQuestionnaireClick = (questionnaire: Questionnaire) => {
    navigate(`/questionnaire/${id}`, { state: { questionnaire, user: loggedInUser } });
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

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

  const status = experiment ? getStatus(experiment.start, experiment.end) : 'Unknown';

  return (
    <div className="questionnaire-dashboard-container" data-testid="questionnaire-dashboard-container">
      {/* Navbar */}
      <Navbar />

      {/* Questionnaires Title */}
      <h1 className="questionnaires-title" data-testid="questionnaires-title">
        Questionnaires for Experiment: {truncateText(experiment?.name || `Experiment ${id}`, 21)}
      </h1>

      {/* Filters Container */}
      <div className="questionnaire-filters-container" data-testid="filters-container">
        {/* Interaction Type Filter */}
        <div className="questionnaire-filter interactiontype-filter" data-testid="interactiontype-filter">
          <label className="questionnaire-filter-label">Filter by Interaction Type:</label>
          <div className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
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
            {isDropdownOpen && (
              <div className="dropdown-content" data-testid="interactiontype-dropdown-content">
                <div
                  data-testid="interactiontype-option-All"
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedInteractionType('All');
                    setIsDropdownOpen(false);
                  }}
                >
                  All
                </div>
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
            )}
          </div>
        </div>

        {/* Search Filter */}
        <div className="questionnaire-filter search-filter" data-testid="search-filter">
          <div className="search-input">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
            <img src="/assets/SearchSVG.svg" alt="Search Icon" className="search-icon" />
          </div>
        </div>
      </div>

      {/* Loading Animation or Questionnaires Table */}
      {isLoading ? (
        <div className="loading-container" data-testid="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Questionnaires Table */}
          <div className="questionnaire-table-container" data-testid="table-container">
            <table className="questionnaires-table" data-testid="questionnaires-table">
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
                  <th onClick={() => requestSort('identifier')}>
                    Internal Name
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('identifier')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('interactionType')}>
                    Interaction Type
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('interactionType')}`}
                    />
                  </th>
                  <th onClick={() => requestSort('numberOfQuestions')}>
                    Amount of Questions
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('numberOfQuestions')}`}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestionnaires.map((questionnaire, index) => (
                  <tr
                    key={questionnaire.ID}
                    className={index % 2 === 0 ? 'row-even' : 'row-odd'}
                    onClick={() => handleQuestionnaireClick(questionnaire)}
                    data-testid={`questionnaire-row-${index}`}
                  >
                    <td>{truncateText(questionnaire.name, 60)}</td>
                    <td>{truncateText(questionnaire.identifier, 60)}</td>
                    <td>{questionnaire.interactionType?.name || 'N/A'}</td>
                    <td>{questionnaire.questions ? questionnaire.questions.length : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Questionnaire Button */}
          <button
            className="add-questionnaire-button"
            onClick={isCreator && status === 'Upcoming' ? navigateToCreateQuestionnaire : undefined}
            disabled={!isCreator || status !== 'Upcoming'}
            title={
              !isCreator
                ? 'A questionnaire can only be created by the owner of the experiment before it goes live.'
                : status !== 'Upcoming'
                ? 'Questionnaires can only be created before the experiment goes live'
                : 'Add a new questionnaire'
            }
            data-testid="add-questionnaire-button"
          >
            <img
              src={
                isCreator && status === 'Upcoming'
                  ? "/assets/AddButtonSVG.svg"
                  : "/assets/GrayAddButtonSVG.svg"
              }
              alt="Add Questionnaire"
            />
          </button>
        </>
      )}
    </div>
  );
};

export default QuestionnaireDashboard;
