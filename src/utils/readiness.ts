// The "Before this goes live" checklist on the experiment overview, computed from data the app already loads
import { Experiment } from '../types/experiment';
import { Message } from '../types/message';
import { Questionnaire } from '../types/questionnaire';
import { formatDate, pluralize } from './format';
import { summarizeTriggers } from './messageTrigger';

export type ReadinessState = 'done' | 'warn' | 'todo';

export interface ReadinessItem {
  id: string;
  state: ReadinessState;
  title: string;
  text: string;
  action?: { label: string; to: string };
}

export interface Readiness {
  items: ReadinessItem[];
  ready: number;
}

// Messages whose trigger answer belongs to this questionnaire
export const linkedMessages = (questionnaire: Questionnaire, messages: Message[]): Message[] => {
  const answerIds = new Set<string>();
  (questionnaire.questions ?? []).forEach((question) => (question.answers ?? []).forEach((answer) => answerIds.add(answer.ID)));
  return messages.filter((message) => message.answer?.ID && answerIds.has(message.answer.ID));
};

export const getReadiness = (experiment: Experiment, questionnaires: Questionnaire[], messages: Message[]): Readiness => {
  const items: ReadinessItem[] = [];
  const startLabel = formatDate(experiment.start);

  const detailParts = ['Name', 'description', 'start date'];
  if (experiment.end) detailParts.push('end date');
  if (experiment.livingLab) detailParts.push(`living lab ${experiment.livingLab.name}`);
  const detailsDone = !!experiment.name?.trim() && !!experiment.description?.trim() && !!experiment.start;
  items.push({
    id: 'details',
    state: detailsDone ? 'done' : 'warn',
    title: detailsDone ? 'Details complete' : 'Details incomplete',
    text: `${detailParts.join(', ')}.${experiment.end ? '' : ' No end date, it runs until you stop it.'}`,
  });

  if (questionnaires.length === 0) {
    items.push({
      id: 'questionnaires',
      state: 'warn',
      title: 'No questionnaires yet',
      text: `App users get nothing to fill in after a report. Add one before ${startLabel}.`,
      action: { label: 'New questionnaire', to: `/questionnairecreation/${experiment.ID}` },
    });
  }

  questionnaires.forEach((questionnaire) => {
    const questionCount = questionnaire.questions?.length ?? 0;
    const linked = linkedMessages(questionnaire, messages).length;
    const interaction = questionnaire.interactionType?.name ? `Interaction type ${questionnaire.interactionType.name}` : 'No interaction type';
    if (questionCount === 0) {
      items.push({
        id: `questionnaire-${questionnaire.ID}`,
        state: 'warn',
        title: `${questionnaire.name} has no questions yet`,
        text: `App users would receive an empty questionnaire. Add questions or delete it before ${startLabel}.`,
        action: { label: 'Add questions', to: `/questionnaire/${questionnaire.ID}` },
      });
    } else {
      items.push({
        id: `questionnaire-${questionnaire.ID}`,
        state: 'done',
        title: `${questionnaire.name} · ${pluralize(questionCount, 'question')}`,
        text: `${interaction}${linked ? ` · ${pluralize(linked, 'answer-triggered message')} linked` : ''}.`,
        action: { label: 'Open', to: `/questionnaire/${questionnaire.ID}` },
      });
    }
  });

  items.push(
    messages.length
      ? {
          id: 'messages',
          state: 'done',
          title: pluralize(messages.length, 'message'),
          text: `${summarizeTriggers(messages)}.`,
          action: { label: 'Open', to: `/messagedashboard/${experiment.ID}` },
        }
      : {
          id: 'messages',
          state: 'todo',
          title: 'No messages',
          text: 'Optional. Messages reach app users on an encounter, a questionnaire answer or an alarm.',
          action: { label: 'New message', to: `/messagecreation/${experiment.ID}` },
        }
  );

  items.push({
    id: 'live',
    state: 'todo',
    title: `Goes live on ${startLabel}`,
    text: 'From that day questionnaires and messages are locked, you can still stop the experiment early.',
  });

  return { items, ready: items.filter((item) => item.state === 'done').length };
};
