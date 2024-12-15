import { useState, useEffect, useRef } from 'react';
import '../styles/Question.css'; // Ensure the path is correct

interface AnswerOption {
  id: string;
  answerIndexValue: number;
  text: string;
  followUpQuestionId: string | null;
  followUpOpen?: boolean;
}

interface QuestionData {
  localId: string;
  indexValue: number;
  type: 'single' | 'multiple';
  questionText: string;
}

interface FullQuestionData {
  localId: string;
  indexValue: number;
  text: string;
  description: string;
  allowMultipleResponse: boolean;
  allowOpenResponse: boolean;
  openResponseFormat: string;
  answers: {
    index: number;
    text: string;
    nextQuestionID: string | null;
  }[];
}

interface QuestionProps {
  localId: string;
  indexValue: number;
  isMultipleChoice: boolean;
  onRemoveQuestion: (localId: string) => void;
  onIndexValueChange: (localId: string, newIndex: number) => void;
  onQuestionTextChange: (localId: string, newText: string) => void;
  allQuestions: QuestionData[];
  currentQuestionText: string;
  onQuestionDataChange?: (localId: string, data: FullQuestionData) => void;
  
  // New initial props:
  initialDescription?: string;
  initialAllowMultiple?: boolean;
  initialAllowOpen?: boolean;
  initialOpenResponseFormat?: string;
  initialAnswers?: {
    id: string;
    answerIndexValue: number;
    text: string;
    followUpQuestionId: string | null;
    followUpOpen?: boolean;
  }[];
}


const Question: React.FC<QuestionProps> = ({
  localId,
  indexValue,
  isMultipleChoice,
  onRemoveQuestion,
  onIndexValueChange,
  onQuestionTextChange,
  allQuestions,
  currentQuestionText,
  onQuestionDataChange,
  initialDescription = '',
  initialAllowMultiple = false,
  initialAllowOpen = false,
  initialOpenResponseFormat = '',
  initialAnswers = [
    { id: 'A', answerIndexValue: 1, text: '', followUpQuestionId: null, followUpOpen: false },
    { id: 'B', answerIndexValue: 2, text: '', followUpQuestionId: null, followUpOpen: false },
    { id: 'C', answerIndexValue: 3, text: '', followUpQuestionId: null, followUpOpen: false },
  ]
}) => {
  const [questionText, setQuestionText] = useState(currentQuestionText);
  const [questionDescription, setQuestionDescription] = useState(initialDescription);
  // Sort initialAnswers only once before placing them into state
const sortedInitialAnswers = isMultipleChoice
  ? [...initialAnswers].sort((a, b) => a.answerIndexValue - b.answerIndexValue)
  : [];

  const [answers, setAnswers] = useState<AnswerOption[]>(sortedInitialAnswers);

  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(initialAllowMultiple);
  const [allowOpenAnswers, setAllowOpenAnswers] = useState(
    isMultipleChoice ? initialAllowOpen ?? false : true
  );
  const [regexValue, setRegexValue] = useState(initialOpenResponseFormat);
  
  // Compute unique sorted indices without using Set
  const uniqueIndices = answers
  .map(a => a.answerIndexValue)
  .filter((value, index, self) => self.indexOf(value) === index)
  .sort((a, b) => a - b);

  // Function to get letter based on answerIndexValue
  const getLetter = (answerIndexValue: number): string => {
  const letterIndex = uniqueIndices.indexOf(answerIndexValue);
  return String.fromCharCode(65 + letterIndex); 
  };

  useEffect(() => {
    if (!isMultipleChoice && !allowOpenAnswers) {
      setAllowOpenAnswers(true);
    }
  }, [isMultipleChoice, allowOpenAnswers]);

  // Update parent with current question text
  useEffect(() => {
    onQuestionTextChange(localId, questionText);
  }, [questionText, localId, onQuestionTextChange]);

  const sortedQuestions = [...allQuestions].sort((a, b) => a.indexValue - b.indexValue);
  const currentQuestionIndexInSorted = sortedQuestions.findIndex(q => q.localId === localId);
  const possibleFollowUps = sortedQuestions.slice(currentQuestionIndexInSorted + 1);

  useEffect(() => {
    const updatedAnswers = answers.map((answer) => {
      if (answer.followUpQuestionId !== null) {
        const referencedQuestion = allQuestions.find(
          (q) => q.localId === answer.followUpQuestionId
        );
        // If no referenced question or it's not strictly after this question, reset
        if (!referencedQuestion || referencedQuestion.indexValue <= indexValue) {
          return { ...answer, followUpQuestionId: null };
        }
      }
      return answer;
    });
    setAnswers(updatedAnswers);
  }, [allQuestions, indexValue, answers]);

  // Use a ref to store the last sent data to avoid infinite loops
  const lastFullDataRef = useRef<FullQuestionData | null>(null);

  useEffect(() => {
    if (onQuestionDataChange) {
      const fullData: FullQuestionData = {
        localId,
        indexValue,
        text: questionText,
        description: questionDescription,
        allowMultipleResponse: allowMultipleAnswers,
        allowOpenResponse: allowOpenAnswers,
        openResponseFormat: regexValue,
        answers: answers.map(a => ({
          index: a.answerIndexValue,
          text: a.text,
          nextQuestionID: a.followUpQuestionId
        }))
      };

      // Only call onQuestionDataChange if something changed
      const dataChanged = JSON.stringify(fullData) !== JSON.stringify(lastFullDataRef.current);
      if (dataChanged) {
        onQuestionDataChange(localId, fullData);
        lastFullDataRef.current = fullData;
      }
    }
  }, [
    localId,
    indexValue,
    questionText,
    questionDescription,
    allowMultipleAnswers,
    allowOpenAnswers,
    regexValue,
    answers,
    onQuestionDataChange
  ]);

  

  const handleRemoveQuestion = () => {
    onRemoveQuestion(localId);
  };

  const handleIndexValueChange = (newIndex: number) => {
    onIndexValueChange(localId, newIndex);
  };

  const handleAnswerChange = (index: number, newText: string) => {
    const newAnswers = [...answers];
    newAnswers[index].text = newText;
    setAnswers(newAnswers);
  };

  const handleRemoveAnswer = (index: number) => {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1);
    setAnswers(newAnswers);
  };

  const handleAddAnswer = () => {
    // Determine the next available answerIndexValue
    const nextIndexValue = answers.length > 0 ? Math.max(...answers.map(a => a.answerIndexValue)) + 1 : 1;
  
    // Assign a unique ID using timestamp
    const newAnswer: AnswerOption = {
      id: `ans-${Date.now()}`, // Unique ID
      answerIndexValue: nextIndexValue,
      text: '',
      followUpQuestionId: null,
      followUpOpen: false
    };
  
    setAnswers([...answers, newAnswer]);
  };

  const handleAnswerIndexValueChange = (index: number, newValue: number) => {
    const newAnswers = [...answers];
    newAnswers[index].answerIndexValue = newValue >= 1 ? newValue : 1;
  
    // Re-sort answers based on answerIndexValue
    newAnswers.sort((a, b) => a.answerIndexValue - b.answerIndexValue);
  
    setAnswers(newAnswers);
  };
  

  const toggleFollowUp = (answerIndex: number) => {
    const newAnswers = [...answers];
    const ans = newAnswers[answerIndex];
    // Toggle the dropdown
    if (ans.followUpOpen) {
      ans.followUpOpen = false;
      ans.followUpQuestionId = null; // Reset if closing
    } else {
      ans.followUpOpen = true;
    }
    setAnswers(newAnswers);
  };

  const handleFollowUpChange = (answerIndex: number, newFollowUpId: string | null) => {
    const newAnswers = [...answers];
    newAnswers[answerIndex].followUpQuestionId = newFollowUpId;

    // Validate immediately if the chosen follow-up is not strictly after this question
    if (newFollowUpId) {
      const referenced = allQuestions.find(q => q.localId === newFollowUpId);
      if (referenced && referenced.indexValue <= indexValue) {
        newAnswers[answerIndex].followUpQuestionId = null;
      }
    }

    setAnswers(newAnswers);
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
  };

  const containerClass = `qst-question-container ${isMultipleChoice ? 'multiple-choice' : ''} ${allowOpenAnswers ? 'open-answer-enabled' : ''}`;

  return (
    <div className={containerClass}>
      <div className="qst-header">
        <div className="qst-question-index">
          Question
          <input
            className="qst-question-index-input"
            type="number"
            min="1"
            value={indexValue}
            onChange={(e) => handleIndexValueChange(parseInt(e.target.value) || 1)}
          />
          .
        </div>
        <button className="qst-remove-question-btn" onClick={handleRemoveQuestion}>
          <img src={'../assets/XCloseSVG.svg'} alt="Remove Question" />
        </button>
      </div>

      <div className="qst-input-container qst-question-input-container">
        <input
          className="qst-text-input qst-question-text"
          type="text"
          placeholder="Enter question..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />
      </div>

      <div className="qst-input-container qst-description-input-container">
        <input
          className="qst-text-input qst-description-text"
          type="text"
          placeholder="Enter description..."
          value={questionDescription}
          onChange={(e) => setQuestionDescription(e.target.value)}
        />
      </div>
                {isMultipleChoice && (
                  <>
                    {answers.map((answer, index) => {
            const isFollowUpOpen = answer.followUpOpen;
            const followUpIcon = isFollowUpOpen ? 'FollowUpCloseSVG.svg' : 'FollowUpSVG.svg';

            // Determine letter based on this answer's index value
            const letter = getLetter(answer.answerIndexValue);

            return (
              <div className="qst-answer-row" key={answer.id}>
                <div className="qst-answer-label">{letter}.</div>
                <div className="qst-input-container qst-answer-input-container">
                  <input
                    className="qst-text-input qst-answer-text"
                    type="text"
                    placeholder="Enter answer..."
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                  />
                </div>
                <div className="qst-index-input-container">
                  <input
                    className="qst-index-input"
                    type="number"
                    min="1"
                    value={answer.answerIndexValue}
                    onChange={(e) =>
                      handleAnswerIndexValueChange(index, parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="qst-follow-up-container">
                  <button className="qst-follow-up-btn" onClick={() => toggleFollowUp(index)}>
                    <img src={`../assets/${followUpIcon}`} alt="Follow Up" />
                  </button>
                  {isFollowUpOpen && (
                    possibleFollowUps.length > 0 ? (
                      <div className="qst-follow-up-dropdown">
                        <select
                          className="qst-follow-up-select"
                          value={answer.followUpQuestionId || ''}
                          onChange={(e) => handleFollowUpChange(index, e.target.value || null)}
                        >
                          <option value="">Select a follow-up question</option>
                          {possibleFollowUps.map((q) => (
                            <option key={q.localId} value={q.localId}>
                              {q.questionText
                                ? `${q.indexValue}. ${truncateText(q.questionText, 25)}`
                                : `Question ${q.indexValue}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="qst-follow-up-info">No valid follow-ups</div>
                    )
                  )}
                </div>

                <button className="qst-remove-answer-btn" onClick={() => handleRemoveAnswer(index)}>
                  <img src={'../assets/XCloseSVG.svg'} alt="Remove Answer" />
                </button>
              </div>
            );
          })}

          <div className="qst-create-new-answer-row">
            <div className="qst-answer-label">{String.fromCharCode(65 + answers.length)}.</div>
            <button className="qst-create-new-answer-btn" onClick={handleAddAnswer}>
              <img src={'../assets/AddQuestionButtonSVG.svg'} alt="Add new answer" />
            </button>

            <div className="qst-toggle-row">
              <button
                className="qst-toggle-btn"
                onClick={() => setAllowMultipleAnswers(!allowMultipleAnswers)}
              >
                <img
                  src={
                    allowMultipleAnswers
                      ? '../assets/RadioBoxFilledInSVG.svg'
                      : '../assets/RadioBoxNotFilledSVG.svg'
                  }
                  alt="Toggle multiple answers"
                />
              </button>
              <div className="qst-toggle-label">Allow multiple answers</div>

              <button
                className="qst-toggle-btn"
                style={{ marginLeft: '20px' }}
                onClick={() => setAllowOpenAnswers(!allowOpenAnswers)}
              >
                <img
                  src={
                    allowOpenAnswers
                      ? '../assets/RadioBoxFilledInSVG.svg'
                      : '../assets/RadioBoxNotFilledSVG.svg'
                  }
                  alt="Toggle open answers"
                />
              </button>
              <div className="qst-toggle-label">Allow open answers</div>
            </div>
          </div>

          {allowOpenAnswers && (
            <div className="qst-regex-row">
              <div className="qst-regex-label">Input validation.</div>
              <div className="qst-input-container qst-regex-input-container">
                <input
                  className="qst-text-input qst-regex-text"
                  type="text"
                  placeholder="Enter regex when needed..."
                  value={regexValue}
                  onChange={(e) => setRegexValue(e.target.value)}
                />
              </div>
            </div>
          )}
        </>
      )}

      {!isMultipleChoice && (
        <div className="qst-regex-row">
          <div className="qst-regex-label">Input validation.</div>
          <div className="qst-input-container qst-regex-input-container">
            <input
              className="qst-text-input qst-regex-text"
              type="text"
              placeholder="Enter regex when needed..."
              value={regexValue}
              onChange={(e) => setRegexValue(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Question;
