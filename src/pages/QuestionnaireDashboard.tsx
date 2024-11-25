import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/QuestionnaireDashboard.css';
import { Questionnaire } from '../types/questionnaire';
import { getQuestionnaireByExperimentID } from '../services/questionnaireService';
import { Experiment } from '../types/experiment';

const QuestionnaireDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [experiment] = useState<Experiment | null>(null);
  const [filteredQuestionnaires, setFilteredQuestionnaires] = useState<Questionnaire[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Questionnaire; direction: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const fetchedQuestionnaires = await getQuestionnaireByExperimentID(id);
        setQuestionnaires(fetchedQuestionnaires);
        // Fetch experiment details if needed
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching questionnaires:', error);
        setIsLoading(false);
      }
    };

    fetchQuestionnaires();
  }, [id]);

  useEffect(() => {
    let filtered = [...questionnaires];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((q: Questionnaire) =>
        q.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a: Questionnaire, b: Questionnaire) => {
        let aValue: any = a[sortConfig.key] || '';
        let bValue: any = b[sortConfig.key] || '';

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
  }, [searchQuery, sortConfig, questionnaires]);

  const requestSort = (key: keyof Questionnaire) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIconClass = (columnKey: keyof Questionnaire) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'ascending' ? 'sort-ascending' : 'sort-descending';
    }
    return '';
  };

  const navigateToCreateQuestionnaire = () => {
    navigate(`/questionnairecreation/${id}`);
  };

  const handleQuestionnaireClick = (questionnaire: Questionnaire) => {
    navigate(`/questionnaire/${id}`, { state: { questionnaire } });
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="questionnaire-dashboard-container" data-testid="questionnaire-dashboard-container">
      {/* Navbar */}
      <Navbar />

      {/* Questionnaires Title */}
      <h1 className="questionnaires-title" data-testid="questionnaires-title">
        Questionnaires for Experiment: {truncateText(experiment?.name || `Experiment ${id}`, 35)}
      </h1>

      {/* Filters Container */}
      <div className="questionnaire-filters-container" data-testid="filters-container">
        {/* Search Filter */}
        <div className="questionnaire-filter search-filter" data-testid="search-filter">
          <label className="filter-label">Search:</label>
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
                  <th onClick={() => requestSort('identifier')}>
                    Amount of Questions
                    <img
                      src="/assets/vblacksvg.svg"
                      alt="Sort Icon"
                      className={`sort-icon ${getSortIconClass('identifier')}`}
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
                    <td>{truncateText(questionnaire.name, 35)}</td>
                    <td>{questionnaire.identifier}</td>
                    <td>{questionnaire.interactionType.name}</td>
                    <td>{questionnaire.questions.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Questionnaire Button */}
          <button
            className="add-questionnaire-button"
            onClick={navigateToCreateQuestionnaire}
            data-testid="add-questionnaire-button"
          >
            <img src="/assets/AddButtonSVG.svg" alt="Add Questionnaire" />
          </button>
        </>
      )}
    </div>
  );
};

export default QuestionnaireDashboard;
