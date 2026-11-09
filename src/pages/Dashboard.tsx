import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

// Import API functions
import { getAllLivingLabs } from '../services/livingLabService';
import { getExperiments } from '../services/experimentService';
import { addResponseCounts } from '../services/responseService';
import { RateLimitError } from '../services/problemDetails';

// Import types
import { Experiment } from '../types/experiment';
import { LivingLab } from '../types/livinglab';

import { useCurrentUser } from '../context/UserContext';
import { PHONE_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { useDocumentTitle, useFlash } from '../hooks/usePageChrome';
import LivingLabMenu, { ALL_LABS, NO_LAB } from '../components/LivingLabMenu';
import ExperimentCard from '../components/ExperimentCard';
import ResponseCountsBanner from '../components/ResponseCountsBanner';
import Banner from '../components/ui/Banner';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import Icon from '../components/ui/Icon';
import { EmptyState, LoadingState, SegmentedControl } from '../components/ui/Layout';
import SortHeader, { nextSort, SortState } from '../components/ui/SortHeader';
import StatusChip from '../components/ui/StatusChip';
import { ExperimentStatus, getStatus, overlapsRange } from '../utils/experimentStatus';
import { formatCount, formatPeriod, pluralize } from '../utils/format';

type Scope = 'mine' | 'everyone';
type StatusFilter = 'all' | ExperimentStatus;
type SortKey = 'name' | 'status' | 'livingLab' | 'start' | 'numberOfQuestionnaires' | 'numberOfMessages' | 'responses' | 'messageActivity' | 'owner';

const STATUS_ORDER: Record<ExperimentStatus, number> = { Live: 0, Upcoming: 1, Completed: 2 };

const sortValue = (experiment: Experiment, key: SortKey): string | number => {
  switch (key) {
    case 'name':
      return experiment.name.toLowerCase();
    case 'status':
      return STATUS_ORDER[getStatus(experiment.start, experiment.end)];
    case 'livingLab':
      return experiment.livingLab?.name?.toLowerCase() ?? '';
    case 'owner':
      return experiment.user?.name?.toLowerCase() ?? '';
    case 'start':
      return new Date(experiment.start).getTime() || 0;
    default:
      return experiment[key] ?? 0;
  }
};

// Experiments overview: scope, filters, a sortable table on desktop and cards on phone
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const loggedInUser = useCurrentUser();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [flash, dismissFlash] = useFlash();
  useDocumentTitle('Experiments');

  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [countsRateLimit, setCountsRateLimit] = useState<RateLimitError | null>(null);
  const [retryingCounts, setRetryingCounts] = useState<boolean>(false);

  const [scope, setScope] = useState<Scope>('mine');
  const [selectedLivingLab, setSelectedLivingLab] = useState<string>(ALL_LABS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortState<SortKey> | null>({ key: 'name', direction: 'ascending' });
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  // Fetch living labs and experiments, then each experiment's response count
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoadError(false);
        const [labs, exps] = await Promise.all([getAllLivingLabs(), getExperiments()]);
        const counted = await addResponseCounts(exps);
        if (cancelled) return;
        setLivingLabs(labs);
        setExperiments(counted.experiments);
        setCountsRateLimit(counted.rateLimit);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const scoped = useMemo(
    () => (scope === 'mine' && loggedInUser ? experiments.filter((exp) => exp.user?.ID === loggedInUser.ID) : experiments),
    [experiments, scope, loggedInUser]
  );

  const missingCounts = scoped.filter((exp) => exp.responses === undefined).length;

  // Counts again only the experiments whose response count is missing
  const retryResponseCounts = async () => {
    setRetryingCounts(true);
    const counted = await addResponseCounts(experiments);
    setExperiments(counted.experiments);
    setCountsRateLimit(counted.rateLimit);
    setRetryingCounts(false);
  };

  const filteredExperiments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = scoped.filter((exp) => {
      if (selectedLivingLab === NO_LAB && exp.livingLab) return false;
      if (selectedLivingLab !== ALL_LABS && selectedLivingLab !== NO_LAB && exp.livingLab?.ID !== selectedLivingLab) return false;
      if (statusFilter !== 'all' && getStatus(exp.start, exp.end) !== statusFilter) return false;
      if (!overlapsRange(exp.start, exp.end, startDate, endDate)) return false;
      if (query && !exp.name.toLowerCase().includes(query)) return false;
      return true;
    });

    if (sortConfig) {
      const direction = sortConfig.direction === 'ascending' ? 1 : -1;
      filtered.sort((a, b) => {
        const aValue = sortValue(a, sortConfig.key);
        const bValue = sortValue(b, sortConfig.key);
        if (aValue < bValue) return -direction;
        if (aValue > bValue) return direction;
        return 0;
      });
    }
    return filtered;
  }, [scoped, selectedLivingLab, statusFilter, startDate, endDate, searchQuery, sortConfig]);

  const counts = useMemo(() => {
    const result = { Live: 0, Upcoming: 0, Completed: 0 };
    scoped.forEach((exp) => {
      result[getStatus(exp.start, exp.end)] += 1;
    });
    return result;
  }, [scoped]);

  const activeFilterCount =
    (selectedLivingLab !== ALL_LABS ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (startDate || endDate ? 1 : 0);
  const hasFilters = activeFilterCount > 0 || searchQuery.trim() !== '';

  const clearFilters = () => {
    setSelectedLivingLab(ALL_LABS);
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const requestSort = (key: SortKey) => setSortConfig((current) => nextSort(current, key));
  const showOwner = scope === 'everyone';

  const summary = isLoading
    ? 'Loading experiments…'
    : `${pluralize(scoped.length, 'experiment')} · ${counts.Live} live · ${counts.Upcoming} upcoming · ${counts.Completed} completed`;

  const scopeControl = (
    <SegmentedControl<Scope>
      label="Whose experiments"
      value={scope}
      onChange={setScope}
      block={isPhone}
      options={[
        { value: 'mine', label: 'Mine', testId: 'mine-experiments-toggle' },
        { value: 'everyone', label: "Everyone's", testId: 'all-experiments-toggle' },
      ]}
    />
  );

  const statusSelect = (
    <label className="rc-inline-select">
      <span className="rc-inline-select__label">Status</span>
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} data-testid="status-filter">
        <option value="all">All</option>
        <option value="Upcoming">Upcoming</option>
        <option value="Live">Live</option>
        <option value="Completed">Completed</option>
      </select>
    </label>
  );

  const dateRange = (
    <div className="rc-dashboard__dates" role="group" aria-labelledby="active-between-label">
      <span id="active-between-label" className="rc-dashboard__dates-label">
        Active between
      </span>
      <input
        type="date"
        className="rc-input"
        aria-label="Active from"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        data-testid="start-date-input"
      />
      <span aria-hidden="true" className="rc-muted">
        –
      </span>
      <input
        type="date"
        className="rc-input"
        aria-label="Active until"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        data-testid="end-date-input"
      />
    </div>
  );

  const searchField = (
    <label className="rc-search rc-dashboard__search">
      <Icon name="search" />
      <span className="rc-visually-hidden">Search experiments</span>
      <input
        type="search"
        className="rc-input"
        placeholder="Search experiments"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        data-testid="search-input"
      />
    </label>
  );

  const renderResults = () => {
    if (isLoading) {
      return <LoadingState label="Loading experiments…" testId="loading-container" />;
    }

    if (loadError) {
      return (
        <Banner tone="error" title="Couldn't load experiments.">
          The WildlifeNL API did not answer.{' '}
          <button type="button" className="rc-linkbtn" onClick={() => setReloadKey((key) => key + 1)}>
            Try again
          </button>
        </Banner>
      );
    }

    if (scoped.length === 0) {
      return (
        <EmptyState
          title={scope === 'mine' ? 'You have no experiments yet' : 'No experiments yet'}
          action={
            <Button variant="primary" icon="plus" onClick={() => navigate('/experimentcreation')}>
              New experiment
            </Button>
          }
        >
          An experiment groups the questionnaires and messages app users receive in a living lab during a period.
        </EmptyState>
      );
    }

    const countsBanner = (
      <ResponseCountsBanner missing={missingCounts} rateLimit={countsRateLimit} retrying={retryingCounts} onRetry={retryResponseCounts} />
    );

    if (isPhone) {
      return filteredExperiments.length === 0 ? (
        <EmptyState title="No experiments match" action={<Button onClick={clearFilters}>Clear filters</Button>} />
      ) : (
        <>
          {countsBanner}
          <div className="rc-dashboard__cards">
            {filteredExperiments.map((exp) => (
              <ExperimentCard key={exp.ID} experiment={exp} />
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        {countsBanner}
        <div className="rc-card rc-card--flush">
          <div className="rc-table-wrap" data-testid="table-container">
            <table className="rc-table rc-dashboard__table" data-testid="experiments-table">
              <caption className="rc-visually-hidden">Experiments, sortable by column</caption>
              <thead>
                <tr>
                  <SortHeader label="Name" sortKey="name" sort={sortConfig} onSort={requestSort} />
                  <SortHeader label="Status" sortKey="status" sort={sortConfig} onSort={requestSort} />
                  <SortHeader label="Living lab" sortKey="livingLab" sort={sortConfig} onSort={requestSort} />
                  <SortHeader label="Period" sortKey="start" sort={sortConfig} onSort={requestSort} />
                  <SortHeader label="Questionnaires" sortKey="numberOfQuestionnaires" sort={sortConfig} onSort={requestSort} numeric />
                  <SortHeader label="Messages" sortKey="numberOfMessages" sort={sortConfig} onSort={requestSort} numeric />
                  <SortHeader label="Responses" sortKey="responses" sort={sortConfig} onSort={requestSort} numeric />
                  <SortHeader label="Sent" sortKey="messageActivity" sort={sortConfig} onSort={requestSort} numeric />
                  {showOwner && <SortHeader label="Owner" sortKey="owner" sort={sortConfig} onSort={requestSort} />}
                </tr>
              </thead>
              <tbody>
                {filteredExperiments.map((exp, index) => {
                  const status = getStatus(exp.start, exp.end);
                  const upcoming = status === 'Upcoming';
                  return (
                    <tr
                      key={exp.ID}
                      data-testid={`experiment-row-${exp.ID}`}
                      className={`rc-dashboard__row ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest('a, button')) return;
                        navigate(`/experiment/${exp.ID}`, { state: { experiment: exp } });
                      }}
                    >
                      <td className="rc-table__name">
                        <Link to={`/experiment/${exp.ID}`} state={{ experiment: exp }} className="rc-name-link" data-testid="experiment-name">
                          {exp.name}
                        </Link>
                      </td>
                      <td>
                        <StatusChip status={status} size="sm" />
                      </td>
                      <td className={exp.livingLab ? undefined : 'rc-muted'}>{exp.livingLab?.name ?? 'No living lab'}</td>
                      <td className="rc-table__nowrap">{formatPeriod(exp.start, exp.end)}</td>
                      <td className={`rc-table__num${exp.numberOfQuestionnaires ? '' : ' rc-muted'}`}>{formatCount(exp.numberOfQuestionnaires ?? 0)}</td>
                      <td className={`rc-table__num${exp.numberOfMessages ? '' : ' rc-muted'}`}>{formatCount(exp.numberOfMessages ?? 0)}</td>
                      <td className={`rc-table__num${upcoming || exp.responses === undefined ? ' rc-muted' : ''}`}>
                        {upcoming && !exp.responses ? '—' : formatCount(exp.responses)}
                      </td>
                      <td className={`rc-table__num${upcoming ? ' rc-muted' : ''}`}>{upcoming && !exp.messageActivity ? '—' : formatCount(exp.messageActivity ?? 0)}</td>
                      {showOwner && <td>{exp.user?.name ?? '—'}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredExperiments.length === 0 && (
            <div className="rc-dashboard__no-match">
              <p className="rc-strong">No experiments match these filters</p>
              <Button size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
          <div className="rc-table-footer">
            <span>
              Showing {filteredExperiments.length} of {pluralize(scoped.length, 'experiment')}
            </span>
            <span>Responses and Sent are counted from the WildlifeNL API · Export in the Data tab of each experiment</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`rc-page rc-dashboard${isPhone ? ' rc-dashboard--phone' : ''}`} data-testid="dashboard-container">
      {flash && (
        <Banner tone={flash.tone} title={flash.title} onDismiss={dismissFlash}>
          {flash.text}
        </Banner>
      )}

      <div className="rc-page-header rc-page-header--end">
        <div className="rc-page-header__main">
          <h1 className="rc-title" data-testid="experiments-title">
            Experiments
          </h1>
          <p className="rc-muted">{summary}</p>
        </div>
        {!isPhone && (
          <Button variant="primary" icon="plus" onClick={() => navigate('/experimentcreation')} data-testid="add-experiment-button">
            New experiment
          </Button>
        )}
      </div>

      {isPhone ? (
        <div className="rc-stack" data-testid="filters-container">
          {scopeControl}
          <div className="rc-dashboard__phone-tools">
            {searchField}
            <Button icon="filter" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
              Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rc-toolbar" data-testid="filters-container">
          {scopeControl}
          <LivingLabMenu livingLabs={livingLabs} value={selectedLivingLab} onChange={setSelectedLivingLab} />
          {statusSelect}
          {dateRange}
          <div className="rc-toolbar__end rc-dashboard__search-wrap">{searchField}</div>
        </div>
      )}

      {renderResults()}

      {isPhone && (
        <>
          <Dialog
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            title="Filters"
            variant="sheet"
            footer={
              <>
                <Button variant="quiet" onClick={clearFilters} unavailable={!hasFilters}>
                  Clear filters
                </Button>
                <Button variant="primary" onClick={() => setFiltersOpen(false)}>
                  Show {pluralize(filteredExperiments.length, 'experiment')}
                </Button>
              </>
            }
          >
            <LivingLabMenu livingLabs={livingLabs} value={selectedLivingLab} onChange={setSelectedLivingLab} />
            {statusSelect}
            {dateRange}
          </Dialog>
          <div className="rc-dashboard__phone-bar">
            <Button variant="primary" size="lg" block icon="plus" onClick={() => navigate('/experimentcreation')} data-testid="add-experiment-button">
              New experiment
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
