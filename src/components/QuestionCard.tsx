// One question of the builder as an editable card, or a read-only card once the experiment is live
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Message } from '../types/message';
import { answerLetter, DraftAnswer, DraftQuestion, Issue, testPattern } from '../utils/questionnaireDraft';
import { createId } from '../utils/id';
import { pluralize } from '../utils/format';
import Button from './ui/Button';
import Icon from './ui/Icon';
import { Field } from './ui/Layout';

interface QuestionCardProps {
  question: DraftQuestion;
  number: number;
  sorted: DraftQuestion[];
  numberOf: Map<string, number>;
  readOnly: boolean;
  expanded: boolean;
  issues: Issue[];
  showErrors: boolean;
  linkedByAnswer: Record<string, Message[]>;
  messagesLink: { to: string; state: unknown };
  onToggle: () => void;
  onChange: (question: DraftQuestion) => void;
  onCommitPosition: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onFocus: () => void;
}

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  number,
  sorted,
  numberOf,
  readOnly,
  expanded,
  issues,
  showErrors,
  linkedByAnswer,
  messagesLink,
  onToggle,
  onChange,
  onCommitPosition,
  onDuplicate,
  onRemove,
  onFocus,
}) => {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;
  const [tryValue, setTryValue] = useState('');

  const visibleIssues = showErrors ? issues.filter((issue) => issue.level === 'error') : [];
  const fieldError = (field: Issue['field'], answerKey?: string) =>
    visibleIssues.find((issue) => issue.field === field && (answerKey ? issue.answerKey === answerKey : !issue.answerKey))?.message;

  const isMultiple = question.kind === 'multiple';
  const typed = question.kind === 'open' || question.allowOpen;
  const typeLabel = isMultiple ? 'Multiple choice' : 'Open answer';
  const laterQuestions = sorted.filter((candidate) => candidate.key !== question.key && candidate.position > question.position);

  const update = (changes: Partial<DraftQuestion>) => onChange({ ...question, ...changes });
  const updateAnswer = (key: string, changes: Partial<DraftAnswer>) =>
    update({ answers: question.answers.map((answer) => (answer.key === key ? { ...answer, ...changes } : answer)) });
  const moveAnswer = (index: number, direction: -1 | 1) => {
    const answers = [...question.answers];
    const target = index + direction;
    if (target < 0 || target >= answers.length) return;
    [answers[index], answers[target]] = [answers[target], answers[index]];
    update({ answers });
  };

  const summaryParts = isMultiple
    ? [pluralize(question.answers.length, 'answer'), question.allowMultiple ? 'several answers' : 'one answer', question.allowOpen ? 'typed answer allowed' : '']
    : [question.pattern.trim() ? 'checked against a pattern' : 'free text'];
  const summary = summaryParts.filter(Boolean).join(' · ');

  const skipNotes = question.answers
    .map((answer, index) => {
      if (!answer.next) return null;
      const target = numberOf.get(answer.next);
      if (!target || target <= number + 1) return null;
      const skipped = target - 1 === number + 1 ? `question ${number + 1}` : `questions ${number + 1}–${target - 1}`;
      return `Answer ${answerLetter(index)} skips ${skipped} and continues at ${target}.`;
    })
    .filter(Boolean) as string[];

  const linkNotes = question.answers
    .map((answer, index) => {
      const linked = answer.originalID ? linkedByAnswer[answer.originalID] : undefined;
      return linked?.length ? { key: answer.key, text: `${pluralize(linked.length, 'message')} linked to answer ${answerLetter(index)}` } : null;
    })
    .filter(Boolean) as { key: string; text: string }[];

  const patternResult = typed && question.pattern.trim() && tryValue ? testPattern(question.pattern.trim(), tryValue) : undefined;

  const header = (
    <div className="rc-qcard__head">
      <h2 id={titleId} className="rc-subhead">
        Question {number}
      </h2>
      <span className="rc-chip rc-chip--sm">{typeLabel}</span>
      {!readOnly && expanded ? (
        <label className="rc-qcard__position">
          Position
          <input
            type="number"
            min={1}
            className="rc-input rc-input--sm rc-mono"
            aria-label={`Position of question ${number}`}
            aria-invalid={fieldError('position') ? true : undefined}
            value={Number.isNaN(question.position) ? '' : question.position}
            onChange={(event) => update({ position: event.target.value === '' ? NaN : Number(event.target.value) })}
            onBlur={onCommitPosition}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onCommitPosition();
              }
            }}
          />
        </label>
      ) : (
        <span className="rc-muted rc-small">Position {question.position}</span>
      )}
      {!expanded && (
        <span className="rc-qcard__summary">
          {question.text.trim() || <em className="rc-muted">Untitled question</em>} <span className="rc-muted">· {summary}</span>
        </span>
      )}
      {showErrors && issues.some((issue) => issue.level === 'error') && !expanded && (
        <span className="rc-qcard__error-count">{pluralize(issues.filter((issue) => issue.level === 'error').length, 'problem')}</span>
      )}
      <div className="rc-qcard__tools">
        <Button size="sm" variant="accent" onClick={onToggle} aria-expanded={expanded} aria-controls={bodyId}>
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
        {!readOnly && expanded && (
          <>
            <Button size="sm" variant="quiet" onClick={onDuplicate}>
              Duplicate
            </Button>
            <Button size="sm" variant="danger-quiet" onClick={onRemove}>
              Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );

  if (!expanded) {
    return (
      <section className="rc-card rc-qcard rc-qcard--collapsed" aria-labelledby={titleId} data-testid={`question-card-${number}`} id={bodyId}>
        {header}
      </section>
    );
  }

  if (readOnly) {
    return (
      <section className="rc-card rc-qcard" aria-labelledby={titleId} data-testid={`question-card-${number}`} id={bodyId}>
        {header}
        <div className="rc-stack rc-stack--sm">
          <p className="rc-qcard__text">{question.text}</p>
          {question.description && <p className="rc-muted">{question.description}</p>}
        </div>
        {isMultiple && (
          <ol className="rc-qcard__static-answers">
            {question.answers.map((answer, index) => (
              <li key={answer.key}>
                <span className="rc-qcard__letter">{answerLetter(index)}</span>
                <span>{answer.text}</span>
                {answer.next && <span className="rc-muted rc-small">· jumps to {numberOf.get(answer.next) ?? '?'}</span>}
              </li>
            ))}
          </ol>
        )}
        <p className="rc-muted rc-small">{summary}</p>
        {typed && question.pattern.trim() && (
          <p className="rc-small">
            Pattern <code className="rc-code">{question.pattern}</code>
          </p>
        )}
        {linkNotes.map((note) => (
          <Link key={note.key} to={messagesLink.to} state={messagesLink.state} className="rc-small rc-strong">
            {note.text} · view
          </Link>
        ))}
      </section>
    );
  }

  return (
    <section className="rc-card rc-qcard" aria-labelledby={titleId} data-testid={`question-card-${number}`} onFocus={onFocus} id={bodyId}>
      {header}

      <Field id={`${baseId}-text`} label="Question" hint="shown to app users" error={fieldError('text')}>
        {(control) => (
          <input
            {...control}
            type="text"
            className="rc-input rc-input--lg"
            value={question.text}
            placeholder="Which animal did you see?"
            onChange={(event) => update({ text: event.target.value })}
            data-testid={`question-${number}-text`}
          />
        )}
      </Field>
      <Field id={`${baseId}-description`} label="Description" hint="shown under the question" error={fieldError('description')}>
        {(control) => (
          <input
            {...control}
            type="text"
            className="rc-input"
            value={question.description}
            placeholder="Pick the animal you are most sure about."
            onChange={(event) => update({ description: event.target.value })}
            data-testid={`question-${number}-description`}
          />
        )}
      </Field>

      {isMultiple && (
        <div className="rc-qcard__answers" role="group" aria-labelledby={`${baseId}-answers`}>
          <p id={`${baseId}-answers`} className="rc-label">
            Answers
          </p>
          {fieldError('answers') && <p className="rc-error">{fieldError('answers')}</p>}
          {question.answers.map((answer, index) => {
            const letter = answerLetter(index);
            const textError = fieldError('answer', answer.key);
            const nextError = fieldError('next', answer.key);
            const nextIsListed = !answer.next || laterQuestions.some((candidate) => candidate.key === answer.next);
            return (
              <div key={answer.key} className="rc-qcard__answer">
                <div className="rc-qcard__answer-row">
                  <span className="rc-qcard__letter" aria-hidden="true">
                    {letter}
                  </span>
                  <input
                    type="text"
                    className="rc-input rc-qcard__answer-text"
                    aria-label={`Answer ${letter}`}
                    aria-invalid={textError ? true : undefined}
                    aria-describedby={textError ? `${baseId}-${answer.key}-error` : undefined}
                    value={answer.text}
                    onChange={(event) => updateAnswer(answer.key, { text: event.target.value })}
                    data-testid={`question-${number}-answer-${letter}`}
                  />
                  <select
                    className={`rc-select rc-qcard__next${answer.next ? ' is-set' : ''}`}
                    aria-label={`Follow-up after answer ${letter}`}
                    aria-invalid={nextError ? true : undefined}
                    aria-describedby={nextError ? `${baseId}-${answer.key}-error` : undefined}
                    value={answer.next ?? ''}
                    onChange={(event) => updateAnswer(answer.key, { next: event.target.value || null })}
                  >
                    <option value="">Continue in order</option>
                    {laterQuestions.map((candidate) => (
                      <option key={candidate.key} value={candidate.key}>
                        Jump to {numberOf.get(candidate.key)} · {truncate(candidate.text.trim() || 'Untitled', 28)}
                      </option>
                    ))}
                    {!nextIsListed && answer.next && <option value={answer.next}>Jump to {numberOf.get(answer.next) ?? '?'} (must be later)</option>}
                  </select>
                  <span className="rc-qcard__answer-tools">
                    <Button size="sm" variant="quiet" iconOnly icon="arrow-up" iconSize={12} aria-label={`Move answer ${letter} up`} unavailable={index === 0} onClick={() => moveAnswer(index, -1)} />
                    <Button
                      size="sm"
                      variant="quiet"
                      iconOnly
                      icon="arrow-down"
                      iconSize={12}
                      aria-label={`Move answer ${letter} down`}
                      unavailable={index === question.answers.length - 1}
                      onClick={() => moveAnswer(index, 1)}
                    />
                    <Button
                      size="sm"
                      variant="quiet"
                      iconOnly
                      icon="close"
                      iconSize={12}
                      aria-label={`Remove answer ${letter}`}
                      onClick={() => update({ answers: question.answers.filter((candidate) => candidate.key !== answer.key) })}
                    />
                  </span>
                </div>
                {(textError || nextError) && (
                  <p id={`${baseId}-${answer.key}-error`} className="rc-error rc-qcard__indent">
                    {textError ?? nextError}
                  </p>
                )}
              </div>
            );
          })}
          {(skipNotes.length > 0 || linkNotes.length > 0) && (
            <div className="rc-qcard__notes rc-qcard__indent">
              {skipNotes.map((note) => (
                <span key={note}>{note}</span>
              ))}
              {linkNotes.map((note) => (
                <Link key={note.key} to={messagesLink.to} state={messagesLink.state} className="rc-strong">
                  {note.text} · manage
                </Link>
              ))}
            </div>
          )}
          <div className="rc-qcard__indent">
            <Button
              size="md"
              variant="dashed"
              icon="plus"
              iconSize={14}
              onClick={() => update({ answers: [...question.answers, { key: createId(), text: '', next: null }] })}
              data-testid={`question-${number}-add-answer`}
            >
              Add answer
            </Button>
          </div>
        </div>
      )}

      {isMultiple && (
        <div className="rc-qcard__options">
          <label className="rc-check">
            <input type="checkbox" checked={question.allowMultiple} onChange={(event) => update({ allowMultiple: event.target.checked })} />
            Allow more than one answer
          </label>
          <label className="rc-check">
            <input type="checkbox" checked={question.allowOpen} onChange={(event) => update({ allowOpen: event.target.checked })} />
            Allow a typed answer as well
          </label>
        </div>
      )}

      {typed && (
        <div className="rc-qcard__pattern">
          <Field id={`${baseId}-pattern`} label="Pattern" hint="optional regular expression the typed answer must match" error={fieldError('pattern')}>
            {(control) => (
              <input
                {...control}
                type="text"
                className="rc-input rc-input--mono"
                value={question.pattern}
                placeholder="^\d{4}\s?[A-Z]{2}$"
                spellCheck={false}
                onChange={(event) => update({ pattern: event.target.value })}
              />
            )}
          </Field>
          <div className="rc-field">
            <label htmlFor={`${baseId}-try`} className="rc-label">
              Try it
            </label>
            <div className="rc-qcard__try">
              <input
                id={`${baseId}-try`}
                type="text"
                className="rc-input"
                value={tryValue}
                placeholder="Type an example answer"
                onChange={(event) => setTryValue(event.target.value)}
              />
              <span
                className={`rc-match ${patternResult === true ? 'rc-match--yes' : patternResult === false || patternResult === null ? 'rc-match--no' : 'rc-match--idle'}`}
                role="status"
              >
                {patternResult === true && <Icon name="check" size={12} />}
                {patternResult === true ? 'Matches' : patternResult === false ? 'No match' : patternResult === null ? 'Invalid pattern' : question.pattern.trim() ? 'Type to test' : 'No pattern'}
              </span>
            </div>
          </div>
        </div>
      )}

      {fieldError('links') && <p className="rc-error">{fieldError('links')}</p>}
    </section>
  );
};

export default QuestionCard;
