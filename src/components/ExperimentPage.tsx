// Frame of every experiment hub page: loads the experiment by URL, shows the header and tabs, and handles missing experiments
import { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useExperiment } from '../hooks/useExperiment';
import { useDocumentTitle, useFlash } from '../hooks/usePageChrome';
import { Experiment } from '../types/experiment';
import ExperimentHeader, { HubTab } from './ExperimentHeader';
import Banner from './ui/Banner';
import { ButtonLink } from './ui/Button';
import { EmptyState, LoadingState } from './ui/Layout';

const TAB_TITLES: Record<HubTab, string> = {
  overview: '',
  questionnaires: 'Questionnaires · ',
  messages: 'Messages · ',
  data: 'Data · ',
};

interface ExperimentPageProps {
  activeTab: HubTab;
  showTimeline?: boolean;
  testId?: string;
  children: (experiment: Experiment) => ReactNode;
}

export const ExperimentNotFound: React.FC<{ what?: string }> = ({ what = 'experiment' }) => (
  <div className="rc-page">
    <EmptyState title={`This ${what} could not be found`} action={<ButtonLink to="/dashboard">Back to experiments</ButtonLink>}>
      It may have been deleted, or the link is incomplete.
    </EmptyState>
  </div>
);

const ExperimentPage: React.FC<ExperimentPageProps> = ({ activeTab, showTimeline, testId, children }) => {
  const { id } = useParams<{ id: string }>();
  const { experiment, loading, notFound, error, reload, setExperiment } = useExperiment(id);
  const [flash, dismissFlash] = useFlash();
  useDocumentTitle(experiment ? `${TAB_TITLES[activeTab]}${experiment.name}` : 'Experiment');

  if (!experiment && loading) {
    return (
      <div className="rc-page">
        <LoadingState label="Loading the experiment…" />
      </div>
    );
  }

  if (!experiment && error) {
    return (
      <div className="rc-page">
        <Banner tone="error" title="Couldn't load the experiment.">
          {error}{' '}
          <button type="button" className="rc-linkbtn" onClick={reload}>
            Try again
          </button>
        </Banner>
      </div>
    );
  }

  if (!experiment || notFound) {
    return <ExperimentNotFound />;
  }

  return (
    <div className="rc-page rc-page--detail" data-testid={testId}>
      {flash && (
        <Banner tone={flash.tone} title={flash.title} onDismiss={dismissFlash}>
          {flash.text}
        </Banner>
      )}
      <ExperimentHeader experiment={experiment} activeTab={activeTab} onExperimentChange={setExperiment} showTimeline={showTimeline} />
      {children(experiment)}
    </div>
  );
};

export default ExperimentPage;
