import React from 'react';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { getMyExperiments } from '../services/experimentService';
import { getQuestionnaireByExperimentID } from '../services/questionnaireService';
import { getResponsesByExperimentID } from '../services/responseService';
import { getConveyancesByExperimentID } from '../services/conveyanceService';
import { Experiment } from '../types/experiment';
import { Questionnaire } from '../types/questionnaire';
import '../styles/Export.css';

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

  const truncateText = (text: string, maxLength: number = 100): string => {
    return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;
  };

  useEffect(() => {
    (async () => {
      const data = await getMyExperiments();
      const expsWithResponses = data.map(exp => ({
        ...exp,
        responses: (exp.messageActivity ?? 0) + (exp.questionnaireActivity ?? 0),
      }));
      setExperiments(expsWithResponses);
    })();
  }, []);

  useEffect(() => {
    const filtered = experiments.filter(exp =>
      exp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredExperiments(filtered);
  }, [experiments, searchQuery]);

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
  }, [sortConfig]);

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

  function convertToCSV(data: any[]) {
    if (!data || data.length === 0) return '';
    const { headers, rows } = buildTableData(data);

    const csvLines = [];
    csvLines.push(headers.join(','));
    rows.forEach(row => {
      csvLines.push(row.join(','));
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

  return (
    <div>
      {/* Navbar */}
      <Navbar />
      <h1 className="export-title">Export</h1>
      {/* Search Filter */}
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
                      <td></td>
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
