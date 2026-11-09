// Editable copy of a questionnaire's questions for the builder, with validation, the flow summary and the save sequence
import { addQuestionsWithAnswers, deleteQuestion } from '../services/questionService';
import { deleteAnswer } from '../services/answerService';
import { Questionnaire } from '../types/questionnaire';
import { AddQuestionWithAnswers } from '../types/question';
import { Message } from '../types/message';
import { createId } from './id';

export type QuestionKind = 'multiple' | 'open';

export interface DraftAnswer {
  key: string;
  text: string;
  next: string | null;
  originalID?: string;
}

export interface DraftQuestion {
  key: string;
  kind: QuestionKind;
  position: number;
  text: string;
  description: string;
  allowMultiple: boolean;
  allowOpen: boolean;
  pattern: string;
  answers: DraftAnswer[];
  originalID?: string;
}

export interface OriginalIds {
  questionIDs: string[];
  answerIDs: string[];
}

export type IssueField = 'text' | 'description' | 'position' | 'answers' | 'answer' | 'next' | 'pattern' | 'links';

export interface Issue {
  id: string;
  level: 'error' | 'suggestion';
  check: 'text' | 'description' | 'answers' | 'flow' | 'pattern' | 'links' | 'empty';
  questionKey?: string;
  answerKey?: string;
  field?: IssueField;
  message: string;
}

export const answerLetter = (index: number): string => {
  let label = '';
  let value = index;
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
};

// Existing questions keep their API ID as key, so follow-ups (nextQuestionID) point at keys directly
export const toDraft = (questionnaire: Questionnaire | null | undefined): DraftQuestion[] => {
  const questions = [...(questionnaire?.questions ?? [])].sort((a, b) => a.index - b.index);
  const keys = new Set(questions.map((question) => question.ID));
  return questions.map((question) => {
    const answers = [...(question.answers ?? [])].sort((a, b) => a.index - b.index);
    return {
      key: question.ID,
      originalID: question.ID,
      kind: answers.length > 0 ? 'multiple' : 'open',
      position: question.index,
      text: question.text ?? '',
      description: question.description ?? '',
      allowMultiple: !!question.allowMultipleResponse,
      allowOpen: answers.length > 0 ? !!question.allowOpenResponse : true,
      pattern: question.openResponseFormat ?? '',
      answers: answers.map((answer) => ({
        key: answer.ID,
        originalID: answer.ID,
        text: answer.text ?? '',
        next: answer.nextQuestionID && keys.has(answer.nextQuestionID) ? answer.nextQuestionID : null,
      })),
    };
  });
};

export const originalIdsOf = (questionnaire: Questionnaire | null | undefined): OriginalIds => ({
  questionIDs: (questionnaire?.questions ?? []).map((question) => question.ID),
  answerIDs: (questionnaire?.questions ?? []).flatMap((question) => (question.answers ?? []).map((answer) => answer.ID)),
});

export const newQuestion = (kind: QuestionKind, position: number): DraftQuestion => ({
  key: createId(),
  kind,
  position,
  text: '',
  description: '',
  allowMultiple: false,
  allowOpen: kind === 'open',
  pattern: '',
  answers: kind === 'multiple' ? [0, 1, 2].map(() => ({ key: createId(), text: '', next: null })) : [],
});

// Questions in the order app users see them, ties keep the order of the list
export const sortedQuestions = (draft: DraftQuestion[]): DraftQuestion[] =>
  draft.map((question, order) => ({ question, order })).sort((a, b) => a.question.position - b.question.position || a.order - b.order).map(({ question }) => question);

// Payload for addQuestionsWithAnswers, answers numbered 1 to n in row order and follow-ups by key
export const toAddQuestions = (draft: DraftQuestion[]): AddQuestionWithAnswers[] => {
  const keys = new Set(draft.map((question) => question.key));
  return sortedQuestions(draft).map((question) => ({
    localId: question.key,
    allowMultipleResponse: question.kind === 'multiple' ? question.allowMultiple : false,
    allowOpenResponse: question.kind === 'open' ? true : question.allowOpen,
    description: question.description.trim(),
    index: question.position,
    openResponseFormat: question.kind === 'open' || question.allowOpen ? question.pattern.trim() : '',
    text: question.text.trim(),
    answers:
      question.kind === 'multiple'
        ? question.answers.map((answer, index) => ({
            index: index + 1,
            text: answer.text.trim(),
            nextQuestionID: answer.next && keys.has(answer.next) ? answer.next : null,
          }))
        : [],
  }));
};

// Same anchoring the old regex popup used, null when the pattern itself is invalid
export const testPattern = (pattern: string, value: string): boolean | null => {
  try {
    return new RegExp(`^(?:${pattern})$`).test(value);
  } catch {
    return null;
  }
};

export const isValidPattern = (pattern: string): boolean => {
  if (!pattern.trim()) return true;
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

export interface MinLengthRules {
  question?: number;
  answer?: number;
}

const tooShort = (value: string, min?: number) => !!min && value.trim().length < min;

// Errors block saving, suggestions only show in the Checks panel, orphanLinks counts links to answers no longer in the draft
export const validateDraft = (draft: DraftQuestion[], rules: MinLengthRules, linked: Record<string, Message[]> = {}, orphanLinks = 0): Issue[] => {
  const issues: Issue[] = [];

  if (orphanLinks > 0) {
    issues.push({
      id: 'orphan-links',
      level: 'error',
      check: 'links',
      message: `A removed answer still has ${orphanLinks === 1 ? 'a linked message' : `${orphanLinks} linked messages`}. Delete ${orphanLinks === 1 ? 'that message' : 'those messages'} first, or discard the change.`,
    });
  }
  const sorted = sortedQuestions(draft);
  const numberOf = new Map(sorted.map((question, index) => [question.key, index + 1]));

  if (draft.length === 0) {
    issues.push({ id: 'empty', level: 'suggestion', check: 'empty', message: 'There are no questions yet, app users would receive an empty questionnaire.' });
  }

  sorted.forEach((question) => {
    const number = numberOf.get(question.key);
    const label = `Question ${number}`;

    if (!question.text.trim()) {
      issues.push({ id: `${question.key}-text`, level: 'error', check: 'text', questionKey: question.key, field: 'text', message: `${label} has no text.` });
    } else if (tooShort(question.text, rules.question)) {
      issues.push({
        id: `${question.key}-text`,
        level: 'error',
        check: 'text',
        questionKey: question.key,
        field: 'text',
        message: `${label} needs at least ${rules.question} characters, the API rejects shorter questions.`,
      });
    }

    if (!question.description.trim()) {
      issues.push({
        id: `${question.key}-description`,
        level: 'error',
        check: 'description',
        questionKey: question.key,
        field: 'description',
        message: `${label} needs a description, the API requires one.`,
      });
    }

    if (!Number.isInteger(question.position) || question.position < 1) {
      issues.push({ id: `${question.key}-position`, level: 'error', check: 'flow', questionKey: question.key, field: 'position', message: `${label} needs a position of 1 or more.` });
    }

    if (question.kind === 'multiple') {
      if (question.answers.length === 0) {
        issues.push({ id: `${question.key}-answers`, level: 'error', check: 'answers', questionKey: question.key, field: 'answers', message: `${label} needs at least one answer.` });
      }
      question.answers.forEach((answer, index) => {
        const answerLabel = `answer ${answerLetter(index)} of ${label.toLowerCase()}`;
        if (!answer.text.trim()) {
          issues.push({ id: `${answer.key}-text`, level: 'error', check: 'answers', questionKey: question.key, answerKey: answer.key, field: 'answer', message: `Write ${answerLabel}.` });
        } else if (tooShort(answer.text, rules.answer)) {
          issues.push({
            id: `${answer.key}-text`,
            level: 'error',
            check: 'answers',
            questionKey: question.key,
            answerKey: answer.key,
            field: 'answer',
            message: `${answerLabel[0].toUpperCase()}${answerLabel.slice(1)} needs at least ${rules.answer} characters.`,
          });
        }
        if (answer.next) {
          const target = draft.find((candidate) => candidate.key === answer.next);
          if (!target || target.position <= question.position) {
            issues.push({
              id: `${answer.key}-next`,
              level: 'error',
              check: 'flow',
              questionKey: question.key,
              answerKey: answer.key,
              field: 'next',
              message: `The follow-up after ${answerLabel} must be a later question.`,
            });
          }
        }
      });
    }

    if ((question.kind === 'open' || question.allowOpen) && !isValidPattern(question.pattern)) {
      issues.push({ id: `${question.key}-pattern`, level: 'error', check: 'pattern', questionKey: question.key, field: 'pattern', message: `The pattern of ${label.toLowerCase()} is not a valid regular expression.` });
    }

    if (linked[question.key]?.length) {
      issues.push({
        id: `${question.key}-links`,
        level: 'error',
        check: 'links',
        questionKey: question.key,
        field: 'links',
        message: `${label} has an answer with a linked message. Saving recreates the answers, so delete that message first and add it again afterwards.`,
      });
    }
  });

  return issues;
};

// "1. Which animal did you see? · D → 4" lines for the Flow panel
export const flowSummary = (draft: DraftQuestion[]): { key: string; text: string; detail: string }[] => {
  const sorted = sortedQuestions(draft);
  const numberOf = new Map(sorted.map((question, index) => [question.key, index + 1]));
  return sorted.map((question) => {
    const jumps = question.answers
      .map((answer, index) => (answer.next ? `${answerLetter(index)} → ${numberOf.get(answer.next) ?? '?'}` : null))
      .filter(Boolean);
    const details = [...jumps];
    if ((question.kind === 'open' || question.allowOpen) && question.pattern.trim()) details.push('pattern');
    return { key: question.key, text: question.text.trim() || 'Untitled question', detail: details.join(', ') };
  });
};

// Messages whose trigger answer is one of these answer IDs
export const messagesLinkedTo = (answerIDs: string[], messages: Message[]): Message[] => {
  const ids = new Set(answerIDs);
  return messages.filter((message) => message.answer?.ID && ids.has(message.answer.ID));
};

// Linked messages whose answer was removed from the draft, saving would still delete that stored answer
export const orphanedLinks = (draft: DraftQuestion[], linked: Message[]): number => {
  const kept = new Set(draft.flatMap((question) => question.answers.map((answer) => answer.originalID).filter(Boolean)));
  return linked.filter((message) => !kept.has(message.answer?.ID)).length;
};

// Messages linked to the answers of each question, keyed by question key
export const linkedMessagesByQuestion = (draft: DraftQuestion[], messages: Message[]): Record<string, Message[]> => {
  const result: Record<string, Message[]> = {};
  draft.forEach((question) => {
    const ids = new Set(question.answers.map((answer) => answer.originalID).filter(Boolean));
    const found = messages.filter((message) => message.answer?.ID && ids.has(message.answer.ID));
    if (found.length) result[question.key] = found;
  });
  return result;
};

// Today's save sequence: delete the stored answers, then the stored questions, then add the draft, reporting each delete so a retry skips it
export const saveQuestionnaireDraft = async (
  questionnaireID: string,
  original: OriginalIds,
  draft: DraftQuestion[],
  onDeleted: (kind: 'answer' | 'question', id: string) => void
): Promise<void> => {
  for (const answerID of original.answerIDs) {
    await deleteAnswer(answerID);
    onDeleted('answer', answerID);
  }
  for (const questionID of original.questionIDs) {
    await deleteQuestion(questionID);
    onDeleted('question', questionID);
  }
  await addQuestionsWithAnswers(questionnaireID, toAddQuestions(draft));
};
