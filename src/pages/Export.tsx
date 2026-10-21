import React from 'react';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { getExperiments } from '../services/experimentService';
import { getMyProfile } from '../services/profileService';
import { getQuestionnaireByExperimentID } from '../services/questionnaireService';
import { getResponsesByExperimentID, getResponsesByQuestionnaireID, getResponseCountByExperimentID } from '../services/responseService';
import { getConveyancesByExperimentID } from '../services/conveyanceService';
import { getAllLivingLabs } from '../services/livingLabService';
import { getAnimalLocationsInLivingLab } from '../services/animalService';
import { getDetectionsInLivingLab } from '../services/detectionService';
import { Experiment } from '../types/experiment';
import { Questionnaire } from '../types/questionnaire';
import { User } from '../types/user';
import { LivingLab } from '../types/livinglab';
import '../styles/Export.css';

interface AnimalDataExport {
  title: string;
  fileName: string;
  data: any[];
  headers: string[];
  rows: string[][];
}

const Export: React.FC = () => {

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [questionnairesByExperiment, setQuestionnairesByExperiment] = useState<Record<string, Questionnaire[]>>({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupResponses, setPopupResponses] = useState<any[]>([]);
 
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<string[][]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'responses'; direction: 'ascending' | 'descending' } | null>(null);
  const [showConveyancePopup, setShowConveyancePopup] = useState(false);
  const [popupConveyances, setPopupConveyances] = useState<any[]>([]);
  const [conveyanceTableHeaders, setConveyanceTableHeaders] = useState<string[]>([]);
  const [conveyanceTableRows, setConveyanceTableRows] = useState<string[][]>([]);
  const [currentExperimentName, setCurrentExperimentName] = useState<string>('');
  const [showQuestionnairePopup, setShowQuestionnairePopup] = useState(false);
  const [popupQuestionnaireResponses, setPopupQuestionnaireResponses] = useState<any[]>([]);
  const [questionnaireTableHeaders, setQuestionnaireTableHeaders] = useState<string[]>([]);
  const [questionnaireTableRows, setQuestionnaireTableRows] = useState<string[][]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [allExperimentsChecked, setAllExperimentsChecked] = useState<boolean>(false);
  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [selectedLivingLab, setSelectedLivingLab] = useState<LivingLab | null>(null);
  const [isLivingLabDropdownOpen, setIsLivingLabDropdownOpen] = useState<boolean>(false);
  const [animalDataStartDate, setAnimalDataStartDate] = useState<string>('');
  const [animalDataEndDate, setAnimalDataEndDate] = useState<string>('');
  const [animalDataLoading, setAnimalDataLoading] = useState<'locations' | 'detections' | null>(null);
  const [animalDataExport, setAnimalDataExport] = useState<AnimalDataExport | null>(null);

  const truncateText = (text: string, maxLength: number = 100): string => {
    return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;
  };

  useEffect(() => {
    (async () => {
      const [exps, user] = await Promise.all([
        getExperiments(),
        getMyProfile()
      ]);
      setLoggedInUser(user);
      const responseCounts = await Promise.all(
        exps.map(exp => getResponseCountByExperimentID(exp.ID).catch(() => 0))
      );
      const expsWithResponses = exps.map((exp, index) => ({
        ...exp,
        responses: responseCounts[index],
      }));
      setExperiments(expsWithResponses);
    })();
  }, []);

  useEffect(() => {
    getAllLivingLabs()
      .then(setLivingLabs)
      .catch((error) => console.error('Error fetching living labs:', error));
  }, []);

  useEffect(() => {
    let filtered = [...experiments];
    if (searchQuery) {
      filtered = filtered.filter(exp =>
        exp.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (!allExperimentsChecked && loggedInUser) {
      filtered = filtered.filter(exp => exp.user?.ID === loggedInUser.ID);
    }
    setFilteredExperiments(filtered);
  }, [experiments, searchQuery, allExperimentsChecked, loggedInUser]);

  useEffect(() => {
    let sortedExperiments = [...filteredExperiments];
    if (sortConfig !== null) {
      sortedExperiments.sort((a, b) => {
        let aKey: string | number = a[sortConfig.key];
        let bKey: string | number = b[sortConfig.key];

        if (typeof aKey === 'string' && typeof bKey === 'string') {
          aKey = aKey.toLowerCase();
          bKey = bKey.toLowerCase();
        }

        if (aKey < bKey) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aKey > bKey) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
      setFilteredExperiments(sortedExperiments);
    }
  }, [filteredExperiments, sortConfig]);

  const handleExperimentClick = async (experimentId: string) => {
    if (!questionnairesByExperiment[experimentId]) {
      const qs = await getQuestionnaireByExperimentID(experimentId);
      setQuestionnairesByExperiment(prev => ({ ...prev, [experimentId]: qs }));
    } else {
      setQuestionnairesByExperiment(prev => {
        const updated = { ...prev };
        delete updated[experimentId];
        return updated;
      });
    }
  };

  // Helper to recursively extract keys from nested objects
  const extractKeys = (obj: any, parentKey: string = '', keys: Set<string>) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = parentKey ? `${parentKey}_${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          extractKeys(obj[key], fullKey, keys);
        } else {
          keys.add(fullKey);
        }
      }
    }
  };

  // Updated buildTableData to handle dynamic and nested fields, including boolean values
  function buildTableData(data: any[]) {
    if (!data || data.length === 0) return { headers: [], rows: [] };

    const allKeys = new Set<string>();
    data.forEach(obj => extractKeys(obj, '', allKeys));

    const headers = Array.from(allKeys);
    const rows = data.map(obj => {
      const row: string[] = [];
      headers.forEach(key => {
        const keys = key.split('_');
        let value = obj;
        keys.forEach(k => {
          value = value ? value[k] : '';
        });
        if (typeof value === 'boolean') {
          row.push(value.toString());
        } else {
          row.push(typeof value === 'object' ? JSON.stringify(value) : value ?? '');
        }
      });
      return row;
    });

    return { headers, rows };
  }

  // Quote values containing commas, quotes or line breaks so they stay in their own column
  const escapeCSVValue = (value: any): string => {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  function convertToCSV(data: any[]) {
    if (!data || data.length === 0) return '';
    const { headers, rows } = buildTableData(data);

    const csvLines = [];
    csvLines.push(headers.map(escapeCSVValue).join(','));
    rows.forEach(row => {
      csvLines.push(row.map(escapeCSVValue).join(','));
    });
    return csvLines.join('\n');
  }

  const handleShowResponses = async (experimentId: string, experimentName: string) => {
    try {
      setCurrentExperimentName(experimentName);
      const data = await getResponsesByExperimentID(experimentId);
      const { headers, rows } = buildTableData(data);
      setTableHeaders(headers);
      setTableRows(rows.slice(0, 10)); // show first 10 rows
      setPopupResponses(data);
      setShowPopup(true);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const downloadCSV = () => {
    const csv = convertToCSV(popupResponses);
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}H-${String(now.getMinutes()).padStart(2, '0')}M-${String(now.getSeconds()).padStart(2, '0')}S`;
    const filename = `Responses_${currentExperimentName}_${dateTime}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const requestSort = (key: 'name' | 'responses') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIconClass = (columnKey: 'name' | 'responses') => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'ascending' ? 'export-sort-ascending' : 'export-sort-descending';
    }
    return '';
  };

  const handleShowConveyances = async (experimentId: string, experimentName: string) => {
    try {
      setCurrentExperimentName(experimentName);
      const data = await getConveyancesByExperimentID(experimentId);
      const { headers, rows } = buildTableData(data);
      setConveyanceTableHeaders(headers);
      setConveyanceTableRows(rows.slice(0, 10)); // show first 10
      setPopupConveyances(data);
      setShowConveyancePopup(true);
    } catch (error) {
      console.error('Error fetching conveyances:', error);
    }
  };

  const downloadCSVConveyances = () => {
    const csv = convertToCSV(popupConveyances);
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}H-${String(now.getMinutes()).padStart(2, '0')}M-${String(now.getSeconds()).padStart(2, '0')}S`;
    const filename = `Conveyances_${currentExperimentName}_${dateTime}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShowQuestionnaireResponses = async (questionnaireId: string, questionnaireName: string) => {
    try {
      setCurrentExperimentName(questionnaireName);
      const data = await getResponsesByQuestionnaireID(questionnaireId);
      const { headers, rows } = buildTableData(data);
      setQuestionnaireTableHeaders(headers);
      setQuestionnaireTableRows(rows.slice(0, 10));
      setPopupQuestionnaireResponses(data);
      setShowQuestionnairePopup(true);
    } catch (error) {
      console.error('Error fetching questionnaire responses:', error);
    }
  };

  const downloadCSVQuestionnaire = () => {
    const csv = convertToCSV(popupQuestionnaireResponses);
    const now = new Date();
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}H-${String(now.getMinutes()).padStart(2, '0')}M-${String(now.getSeconds()).padStart(2, '0')}S`;
    const filename = `QuestionnaireResponses_${currentExperimentName}_${dateTime}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAnimalDataPeriod = (): { start: string; end: string } | null => {
    if (!selectedLivingLab || !animalDataStartDate || !animalDataEndDate) {
      alert('Please select a LivingLab and a period.');
      return null;
    }
    const start = new Date(`${animalDataStartDate}T00:00:00`);
    const end = new Date(`${animalDataEndDate}T23:59:59.999`);
    if (start > end) {
      alert('The start date must be before the end date.');
      return null;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const showAnimalDataExport = (title: string, filePrefix: string, data: any[]) => {
    const { headers, rows } = buildTableData(data);
    setAnimalDataExport({
      title,
      fileName: `${filePrefix}_${selectedLivingLab?.name}_${animalDataStartDate}_${animalDataEndDate}.csv`,
      data,
      headers,
      rows: rows.slice(0, 10), // show first 10 rows
    });
  };

  const handleShowAnimalLocations = async () => {
    const period = getAnimalDataPeriod();
    if (!period || !selectedLivingLab) return;
    setAnimalDataLoading('locations');
    try {
      const data = await getAnimalLocationsInLivingLab(selectedLivingLab, period.start, period.end);
      showAnimalDataExport('animal locations', 'AnimalLocations', data);
    } catch (error) {
      console.error('Error fetching animal locations:', error);
      alert(`Failed to fetch animal locations.\n${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setAnimalDataLoading(null);
    }
  };

  const handleShowDetections = async () => {
    const period = getAnimalDataPeriod();
    if (!period || !selectedLivingLab) return;
    setAnimalDataLoading('detections');
    try {
      const detections = await getDetectionsInLivingLab(selectedLivingLab, period.start, period.end);
      // One row per detected animal, the detection columns are repeated for every animal
      const data = detections.flatMap((detection) => {
        const animals = detection.animals?.length ? detection.animals : [{}];
        return animals.map((animal) => ({
          detectionID: detection.ID,
          start: detection.start,
          end: detection.end,
          latitude: detection.location?.latitude,
          longitude: detection.location?.longitude,
          species: detection.species?.name,
          commonName: detection.species?.commonName,
          sensorType: detection.sensorType ?? '',
          deploymentID: detection.deploymentID,
          owner: detection.user?.name,
          uri: detection.uri,
          sex: animal.sex,
          lifeStage: animal.lifeStage,
          condition: animal.condition,
          behaviour: animal.behaviour,
          confidence: animal.confidence,
          description: animal.description,
        }));
      });
      showAnimalDataExport('detections', 'Detections', data);
    } catch (error) {
      console.error('Error fetching detections:', error);
      alert(`Failed to fetch detections.\n${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setAnimalDataLoading(null);
    }
  };

  const downloadCSVAnimalData = () => {
    if (!animalDataExport) return;
    const csv = convertToCSV(animalDataExport.data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', animalDataExport.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Navbar */}
      <Navbar />
      <h1 className="export-title">Export</h1>
      {/* Search Filter */}
      <div className="filters-container">
        <div className="filter export-search-filter">
          <div className="export-search-input-container">
            <input
              type="text"
              placeholder="Search experiment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="export-search-input"
            />
            <img src="/assets/SearchSVG.svg" alt="Search Icon" className="export-search-icon" />
          </div>
        </div>
        <div className="filter show-all-experiments-filter">
          <label className="filter-label">All Experiments:</label>
          <button
            className="dashboard-qst-toggle-btn"
            onClick={() => setAllExperimentsChecked(!allExperimentsChecked)}
          >
            <img
              src={
                allExperimentsChecked
                  ? '../assets/RadioBoxFilledInSVG.svg'
                  : '../assets/RadioBoxNotFilledSVG.svg'
              }
              alt="Toggle multiple answers"
            />
          </button>
        </div>
      </div>

      {/* Animal data export for a LivingLab and period */}
      <div className="filters-container export-animal-data-container" data-testid="animal-data-export">
        <div className="filter">
          <label className="filter-label">Animal data in LivingLab:</label>
          <div className={`dropdown ${isLivingLabDropdownOpen ? 'open' : ''}`}>
            <button
              className="dropdown-button"
              onClick={() => setIsLivingLabDropdownOpen(!isLivingLabDropdownOpen)}
              data-testid="export-livinglab-dropdown-button"
            >
              {selectedLivingLab ? truncateText(selectedLivingLab.name, 18) : 'Select LivingLab'}
              <img
                src="/assets/vsvg.svg"
                alt="Dropdown Icon"
                className={`dropdown-icon ${isLivingLabDropdownOpen ? 'dropdown-icon-hover' : ''}`}
              />
            </button>
            <div className="dropdown-content">
              {livingLabs.map((lab) => (
                <div
                  key={lab.ID}
                  className="dropdown-item"
                  data-testid={`export-livinglab-option-${lab.ID}`}
                  onClick={() => {
                    setSelectedLivingLab(lab);
                    setIsLivingLabDropdownOpen(false);
                  }}
                >
                  {lab.name}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="filter">
          <label className="filter-label">Period:</label>
          <div className="date-inputs">
            <div className="date-input">
              <input
                type="date"
                value={animalDataStartDate}
                onChange={(e) => setAnimalDataStartDate(e.target.value)}
                data-testid="export-start-date-input"
              />
            </div>
            <span className="date-separator">-</span>
            <div className="date-input">
              <input
                type="date"
                value={animalDataEndDate}
                onChange={(e) => setAnimalDataEndDate(e.target.value)}
                data-testid="export-end-date-input"
              />
            </div>
          </div>
        </div>
        <div className="filter export-animal-data-actions">
          <button
            onClick={handleShowAnimalLocations}
            disabled={animalDataLoading !== null}
            title="Export the location timeseries of the animals in this LivingLab during this period"
            data-testid="export-animal-locations-button"
          >
            {animalDataLoading === 'locations' ? 'Loading...' : 'Animal Locations'}
          </button>
          <button
            onClick={handleShowDetections}
            disabled={animalDataLoading !== null}
            title="Export the detections in this LivingLab during this period"
            data-testid="export-detections-button"
          >
            {animalDataLoading === 'detections' ? 'Loading...' : 'Detections'}
          </button>
        </div>
      </div>

      {animalDataExport && (
        <div className="popup-overlay show" onClick={() => setAnimalDataExport(null)}>
          <div className={`popup-content ${animalDataExport.rows.length === 0 ? 'popup-content-small' : ''}`} onClick={(e) => e.stopPropagation()}>
            {animalDataExport.rows.length === 0 ? (
              <div className="no-responses-container">
                <div className="no-responses-message">
                  No {animalDataExport.title} found for this LivingLab and period.
                </div>
                <div className="popup-actions">
                  <button className="close-button close-button-no-responses" onClick={() => setAnimalDataExport(null)}>Close</button>
                </div>
              </div>
            ) : (
              <>
                <div className="popup-preview-box">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {animalDataExport.headers.map((header, idx) => (
                          <th key={`ah-${idx}`} style={{ border: '1px solid #ccc', padding: '8px' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {animalDataExport.rows.map((row, i) => (
                        <tr key={`ar-${i}`}>
                          {row.map((cell, j) => (
                            <td key={`ac-${i}-${j}`} style={{ border: '1px solid #ccc', padding: '8px' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="popup-actions">
                  <button className="close-button" onClick={() => setAnimalDataExport(null)}>Close</button>
                  <button className="download-csv-button" onClick={downloadCSVAnimalData}>Download CSV</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showPopup && (
        <div className={`popup-overlay show`} onClick={() => setShowPopup(false)}>
          <div className={`popup-content ${tableRows.length === 0 ? 'popup-content-small' : ''}`} onClick={(e) => e.stopPropagation()}>
            {tableRows.length === 0 ? (
              // Smaller popup with only Close button
              <div className="no-responses-container"> {/* New container for centering */}
                <div className="no-responses-message">
                  No responses found for this experiment.
                </div>
                <div className="popup-actions">
                  <button className="close-button close-button-no-responses" onClick={() => setShowPopup(false)}>Close</button>
                </div>
              </div>
            ) : (
              // Existing popup with table and actions
              <>
                <div className="popup-preview-box"> {/* New preview box */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {tableHeaders.map((header, idx) => (
                          <th key={`h-${idx}`} style={{ border: '1px solid #ccc', padding: '8px' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, i) => (
                        <tr key={`r-${i}`}>
                          {row.map((cell, j) => (
                            <td key={`c-${i}-${j}`} style={{ border: '1px solid #ccc', padding: '8px' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="popup-actions">
                  <button className="close-button" onClick={() => setShowPopup(false)}>Close</button>
                  <button className="download-csv-button" onClick={downloadCSV}>Download CSV</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showConveyancePopup && (
        <div
          className={`popup-overlay show`}
          onClick={() => setShowConveyancePopup(false)}
        >
          <div
            className={`popup-content ${
              conveyanceTableRows.length === 0 ? 'popup-content-small' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {conveyanceTableRows.length === 0 ? (
              <div className="no-responses-container">
                <div className="no-responses-message">No conveyances found for this experiment.</div>
                <div className="popup-actions">
                  <button
                    className="close-button close-button-no-responses"
                    onClick={() => setShowConveyancePopup(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="popup-preview-box">
                  {/* ...similar table structure... */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {conveyanceTableHeaders.map((header, idx) => (
                          <th
                            key={`hc-${idx}`}
                            style={{ border: '1px solid #ccc', padding: '8px' }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {conveyanceTableRows.map((row, i) => (
                        <tr key={`rc-${i}`}>
                          {row.map((cell, j) => (
                            <td
                              key={`cc-${i}-${j}`}
                              style={{ border: '1px solid #ccc', padding: '8px' }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="popup-actions">
                  <button
                    className="close-button"
                    onClick={() => setShowConveyancePopup(false)}
                  >
                    Close
                  </button>
                  <button
                    className="download-csv-button"
                    onClick={downloadCSVConveyances}
                  >
                    Download CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showQuestionnairePopup && (
        <div className="popup-overlay show" onClick={() => setShowQuestionnairePopup(false)}>
          <div className={`popup-content ${questionnaireTableRows.length === 0 ? 'popup-content-small' : ''}`} onClick={(e) => e.stopPropagation()}>
            {questionnaireTableRows.length === 0 ? (
              <div className="no-responses-container">
                <div className="no-responses-message">No responses found for this questionnaire.</div>
                <div className="popup-actions">
                  <button className="close-button close-button-no-responses" onClick={() => setShowQuestionnairePopup(false)}>Close</button>
                </div>
              </div>
            ) : (
              <>
                <div className="popup-preview-box">
                  {/* ...existing code... */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {questionnaireTableHeaders.map((header, idx) => (
                          <th key={`qh-${idx}`} style={{ border: '1px solid #ccc', padding: '8px' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {questionnaireTableRows.map((row, i) => (
                        <tr key={`qr-${i}`}>
                          {row.map((cell, j) => (
                            <td
                              key={`qc-${i}-${j}`}
                              style={{ border: '1px solid #ccc', padding: '8px' }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="popup-actions">
                  <button className="close-button" onClick={() => setShowQuestionnairePopup(false)}>Close</button>
                  <button className="download-csv-button" onClick={downloadCSVQuestionnaire}>Download CSV</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Container + table with new unique classes */}
      <div className="export-table-container-dash">
        <table className="export-table-dash">
          <thead>
            <tr>
              <th
                className="export-experiment-name-header"
                onClick={() => requestSort('name')}
              >
                Experiment Name
                <img
                  src="/assets/vblacksvg.svg"
                  alt="Sort Icon"
                  className={`export-sort-icon ${getSortIconClass('name')}`}
                />
              </th>
              <th className="export-responses-header" onClick={() => requestSort('responses')}>
                Responses
                <img
                  src="/assets/vblacksvg.svg"
                  alt="Sort Icon"
                  className={`export-sort-icon ${getSortIconClass('responses')}`}
                />
              </th>
              {allExperimentsChecked && (
                <th className="export-creator-header">Owner</th>
              )}
              <th className="export-actions-header">Export Options</th>
            </tr>
          </thead>

          <tbody>
            {filteredExperiments.map((experiment: Experiment, expIndex) => {
              // Use striped background like in Dashboard
              const rowClass = expIndex % 2 === 0 ? 'row-even-dash' : 'row-odd-dash';
              const qList = questionnairesByExperiment[experiment.ID];

              return (
                <React.Fragment key={experiment.ID}>
                  <tr className={rowClass} onClick={() => handleExperimentClick(experiment.ID)}>
                    <td className="export-experiment-name-cell">{truncateText(experiment.name)}</td>
                    <td className="export-responses-cell">{experiment.responses}</td>
                    {allExperimentsChecked && (
                      <td className="export-creator-cell">{experiment.user.name}</td>
                    )}
                    <td className="export-actions-cell">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowResponses(experiment.ID, experiment.name);
                        }}
                      >
                        Responses
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowConveyances(experiment.ID, experiment.name);
                        }}
                      >
                        Conveyances
                      </button>
                    </td>
                  </tr>

                  {/* Distinguish Questionnaire rows */}
                  {qList && qList.map((q: Questionnaire) => (
                    <tr className="questionnaire-dash" key={q.ID}>
                      <td className="truncate-text">{truncateText(q.identifier)}</td>
                      <td></td>
                      {allExperimentsChecked && <td></td>}
                      <td className="export-questionnaire-actions-cell">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowQuestionnaireResponses(q.ID, q.identifier);
                          }}
                        >
                          Questionnaire Responses
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Export;
