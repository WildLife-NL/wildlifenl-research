import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { getMyExperiments } from '../services/experimentService';
import { getQuestionnaireByExperimentID } from '../services/questionnaireService';
import { getResponsesByExperimentID } from '../services/responseService';
import { Experiment } from '../types/experiment';
import { Questionnaire } from '../types/questionnaire';
import '../styles/Export.css';

const Export: React.FC = () => {

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [questionnairesByExperiment, setQuestionnairesByExperiment] = useState<Record<string, Questionnaire[]>>({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupResponses, setPopupResponses] = useState<any[]>([]);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [tableRows, setTableRows] = useState<string[][]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'responses'; direction: 'ascending' | 'descending' } | null>(null);

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

  const parseCsvToTable = (csv: string) => {
    const lines = csv.split('\n');
    const headers = lines[0] ? lines[0].split(',') : [];
    const rows = lines.slice(1).map(line => line.split(','));
    return { headers, rows };
  };

  const handleShowResponses = async (experimentId: string) => {
    try {
      const data = await getResponsesByExperimentID(experimentId);
      const csv = convertToCSV(data); // Removed ExperimentResponses
      const { headers, rows } = parseCsvToTable(csv);
      setTableHeaders(headers);
      setTableRows(rows.slice(0, 10)); // Show first 10 rows
      setPopupResponses(data); // Set the data array directly
      setShowPopup(true);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const flattenResponse = (resp: any) => {
    const q = resp.question || {};
    const qq = q.questionnaire || {};
    const exp = qq.experiment || {};
    const expUser = exp.user || {};
    const i = resp.interaction || {};
    const loc = i.location || {};
    const sp = i.species || {};
    const iUser = i.user || {};
    const iType = i.type || {};

    return {
      response_ID: resp.ID ?? '',
      response_Text: resp.text ?? '',
      question_ID: q.ID ?? '',
      question_Text: q.text ?? '',
      question_Description: q.description ?? '',
      question_Index: q.index ?? '',
      question_AllowMultipleResponse: q.allowMultipleResponse ?? '',
      question_AllowOpenResponse: q.allowOpenResponse ?? '',
      questionnaire_ID: qq.ID ?? '',
      questionnaire_Name: qq.name ?? '',
      questionnaire_Identifier: qq.identifier ?? '',
      experiment_ID: exp.ID ?? '',
      experiment_Name: exp.name ?? '',
      experiment_Description: exp.description ?? '',
      experiment_Start: exp.start ?? '',
      experiment_End: exp.end ?? '',
      experiment_UserID: expUser.ID ?? '',
      experiment_UserName: expUser.name ?? '',
      interaction_ID: i.ID ?? '',
      interaction_Description: i.description ?? '',
      interaction_Timestamp: i.timestamp ?? '',
      interaction_Latitude: loc.latitude ?? '',
      interaction_Longitude: loc.longitude ?? '',
      species_ID: sp.ID ?? '',
      species_Name: sp.name ?? '',
      species_CommonName: sp.commonName ?? '',
      interaction_UserID: iUser.ID ?? '',
      interaction_UserName: iUser.name ?? '',
      interactionType_ID: iType.ID ?? '',
      interactionType_Name: iType.name ?? '',
      interactionType_Description: iType.description ?? '',
    };
  };

  const convertToCSV = (data: any[]) => {
    // Flatten each response
    const flattened = data.map(flattenResponse);
    // Create headers from all keys in the first flattened object
    const headers = Object.keys(flattened[0] || {});
    // Build CSV rows
    const rows = flattened.map(item => headers.map(h => (item as any)[h]).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = () => {
    const csv = convertToCSV(popupResponses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'responses.csv');
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
                          handleShowResponses(experiment.ID);
                        }}
                      >
                        Responses
                      </button>
                      <button>Conveyances</button>
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
