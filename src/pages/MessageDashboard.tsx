import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Experiment.css';
import { getMessagesByExperimentID } from '../services/messageService';
import { Message } from '../types/message';
import { Experiment } from '../types/experiment';
import { useCurrentUser } from '../context/UserContext';
import ExperimentPage from '../components/ExperimentPage';
import Banner from '../components/ui/Banner';
import Button, { ButtonLink } from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { EmptyState, LoadingState } from '../components/ui/Layout';
import SortHeader, { nextSort, SortState } from '../components/ui/SortHeader';
import { getExperimentPermissions } from '../utils/experimentPermissions';
import { formatCount, formatDate } from '../utils/format';
import { severityLabel, speciesLabel, triggerLabel } from '../utils/messageTrigger';

type SortKey = 'name' | 'trigger' | 'species' | 'severity' | 'activity';

const sortValue = (message: Message, key: SortKey): string | number => {
  if (key === 'species') return message.species?.commonName?.toLowerCase() ?? '';
  if (key === 'severity' || key === 'activity') return message[key] ?? 0;
  return (message[key] ?? '').toLowerCase();
};

// "within 200 m · readings 10 min apart" for encounter messages
const encounterDetail = (message: Message): string | null => {
  if (message.trigger !== 'encounter') return null;
  const parts = [];
  if (message.encounterMeters) parts.push(`within ${message.encounterMeters} m`);
  if (message.encounterMinutes) parts.push(`${message.encounterMinutes} min`);
  return parts.length ? parts.join(' · ') : null;
};

// Messages tab of the hub: filter by trigger and species, open a message, or start a new one while upcoming
const MessageList: React.FC<{ experiment: Experiment }> = ({ experiment }) => {
  const user = useCurrentUser();
  const permissions = getExperimentPermissions(experiment, user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [selectedTrigger, setSelectedTrigger] = useState<string>('All');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortState<SortKey> | null>({ key: 'name', direction: 'ascending' });

  useEffect(() => {
    let cancelled = false;
    getMessagesByExperimentID(experiment.ID)
      .then((fetched) => !cancelled && setMessages(fetched ?? []))
      .catch((error) => {
        console.error('Error fetching messages:', error);
        if (!cancelled) setLoadError(true);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [experiment.ID]);

  const triggers = useMemo(() => Array.from(new Set(messages.map((message) => message.trigger).filter(Boolean))), [messages]);
  const speciesOptions = useMemo(
    () => Array.from(new Set(messages.map((message) => speciesLabel(message.species)).filter(Boolean))).sort(),
    [messages]
  );

  const visible = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = messages.filter(
      (message) =>
        (selectedTrigger === 'All' || message.trigger === selectedTrigger) &&
        (selectedSpecies === 'All' || speciesLabel(message.species) === selectedSpecies) &&
        (!query || message.name.toLowerCase().includes(query) || message.text.toLowerCase().includes(query))
    );
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
  }, [messages, selectedTrigger, selectedSpecies, searchQuery, sortConfig]);

  const newReason = permissions.canEdit
    ? undefined
    : permissions.isOwner
    ? 'Messages can only be added while the experiment is upcoming.'
    : `${permissions.reasons.edit}.`;

  // An unavailable action is a real button, a link could still open in a new tab
  const newButton = permissions.canEdit ? (
    <ButtonLink to={`/messagecreation/${experiment.ID}`} state={{ experiment }} variant="primary" icon="plus" data-testid="add-message-button">
      New message
    </ButtonLink>
  ) : (
    <Button variant="primary" icon="plus" unavailable aria-describedby="new-message-reason" data-testid="add-message-button">
      New message
    </Button>
  );

  const sortBy = (key: SortKey) => setSortConfig((current) => nextSort(current, key));

  if (isLoading) return <LoadingState label="Loading messages…" testId="loading-container" />;

  if (loadError) {
    return (
      <Banner tone="error" title="Couldn't load the messages.">
        Reload the page to try again.
      </Banner>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState title="No messages yet" action={newButton}>
        Messages reach app users when they meet an animal, answer a questionnaire in a certain way or when WildlifeNL raises an alarm.
        {permissions.canEdit ? ` Add them before ${formatDate(experiment.start)}.` : ` ${newReason}`}
      </EmptyState>
    );
  }

  return (
    <div className="rc-stack" data-testid="message-dashboard-container">
      <div className="rc-toolbar" data-testid="filters-container">
        <label className="rc-inline-select">
          <span className="rc-inline-select__label">Trigger</span>
          <select value={selectedTrigger} onChange={(event) => setSelectedTrigger(event.target.value)}>
            <option value="All">All</option>
            {triggers.map((trigger) => (
              <option key={trigger} value={trigger}>
                {triggerLabel(trigger)}
              </option>
            ))}
          </select>
        </label>
        <label className="rc-inline-select">
          <span className="rc-inline-select__label">Species</span>
          <select value={selectedSpecies} onChange={(event) => setSelectedSpecies(event.target.value)}>
            <option value="All">All</option>
            {speciesOptions.map((species) => (
              <option key={species} value={species}>
                {species}
              </option>
            ))}
          </select>
        </label>
        <label className="rc-search">
          <Icon name="search" />
          <span className="rc-visually-hidden">Search messages</span>
          <input
            type="search"
            className="rc-input"
            placeholder="Search title or text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            data-testid="search-input"
          />
        </label>
        <div className="rc-toolbar__end">{newButton}</div>
      </div>
      {newReason && (
        <p id="new-message-reason" className="rc-help rc-hub__toolbar-note">
          {newReason}
        </p>
      )}

      <div className="rc-card rc-card--flush">
        <div className="rc-table-wrap" data-testid="table-container">
          <table className="rc-table rc-table--stack" data-testid="messages-table">
            <caption className="rc-visually-hidden">Messages of this experiment</caption>
            <thead>
              <tr>
                <SortHeader label="Message" sortKey="name" sort={sortConfig} onSort={sortBy} />
                <SortHeader label="Trigger" sortKey="trigger" sort={sortConfig} onSort={sortBy} />
                <SortHeader label="Species" sortKey="species" sort={sortConfig} onSort={sortBy} />
                <SortHeader label="Severity" sortKey="severity" sort={sortConfig} onSort={sortBy} />
                <SortHeader label="Delivered" sortKey="activity" sort={sortConfig} onSort={sortBy} numeric />
              </tr>
            </thead>
            <tbody>
              {visible.map((message) => {
                const detail = encounterDetail(message);
                return (
                  <tr key={message.ID} data-testid={`message-row-${message.ID}`}>
                    <td className="rc-table__lead rc-table__name">
                      <Link to={`/message/${experiment.ID}/${message.ID}`} state={{ message, experiment }} className="rc-name-link">
                        {message.name}
                      </Link>
                      <span className="rc-hub__text-preview">{message.text}</span>
                    </td>
                    <td data-label="Trigger">
                      {triggerLabel(message.trigger)}
                      {detail && <span className="rc-muted rc-small"> · {detail}</span>}
                    </td>
                    <td data-label="Species">{speciesLabel(message.species) || <span className="rc-muted">Any</span>}</td>
                    <td data-label="Severity">
                      <span className="rc-hub__severity">
                        <span className="rc-swatch" style={{ background: `var(--rc-sev-${message.severity})` }} aria-hidden="true" />
                        {severityLabel(message.severity)}
                      </span>
                    </td>
                    <td data-label="Delivered" className="rc-table__num">
                      {formatCount(message.activity ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <p className="rc-card__note">No messages match these filters.</p>}
      </div>
    </div>
  );
};

const MessageDashboard: React.FC = () => (
  <ExperimentPage activeTab="messages">{(experiment) => <MessageList key={experiment.ID} experiment={experiment} />}</ExperimentPage>
);

export default MessageDashboard;
