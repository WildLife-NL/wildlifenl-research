import React, { useState } from 'react';
import '../styles/Question.css'; // Ensure the path is correct

interface AnswerOption {
  id: string;
  text: string;
}

interface QuestionProps {
  id: number; // Unique identifier
  questionIndex: number; // For display purposes
  isMultipleChoice: boolean;
  onRemoveQuestion: (id: number) => void;
}

const Question: React.FC<QuestionProps> = ({
  id,
  questionIndex,
  isMultipleChoice,
  onRemoveQuestion,
}) => {
  // State for question text and description
  const [questionText, setQuestionText] = useState('');
  const [questionDescription, setQuestionDescription] = useState('');

  // State for answer options (used only if multiple choice)
  const [answers, setAnswers] = useState<AnswerOption[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
  ]);

  // State for toggles (only meaningful for multiple choice)
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [allowOpenAnswers, setAllowOpenAnswers] = useState(false);

  // Regex input state
  const [regexValue, setRegexValue] = useState('');

  // Handle removing the entire question
  const handleRemoveQuestion = () => {
    onRemoveQuestion(id);
  };

  // Handle changing an answer text (multiple choice only)
  const handleAnswerChange = (index: number, newText: string) => {
    const newAnswers = [...answers];
    newAnswers[index].text = newText;
    setAnswers(newAnswers);
  };

  // Handle removing a single answer (multiple choice only)
  const handleRemoveAnswer = (index: number) => {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1);

    // Re-label answers from A, B, C... based on new order
    const updatedAnswers = newAnswers.map((ans, i) => {
      return { ...ans, id: String.fromCharCode(65 + i) }; // 65 = 'A'
    });
    setAnswers(updatedAnswers);
  };

  // Handle adding a new answer (multiple choice only)
  const handleAddAnswer = () => {
    const nextLetter = String.fromCharCode(65 + answers.length);
    setAnswers([...answers, { id: nextLetter, text: '' }]);
  };

  const containerClass = `qst-question-container ${isMultipleChoice ? 'multiple-choice' : ''} ${allowOpenAnswers ? 'open-answer-enabled' : ''}`;

  return (
    <div className={containerClass}>
      <div className="qst-header">
        <div className="qst-question-index">Question {questionIndex}.</div>
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
          {/* Answer Options */}
          {answers.map((answer, index) => (
            <div className="qst-answer-row" key={answer.id}>
              <div className="qst-answer-label">{answer.id}.</div>
              <div className="qst-input-container qst-answer-input-container">
                <input
                  className="qst-text-input qst-answer-text"
                  type="text"
                  placeholder="Enter answer..."
                  value={answer.text}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                />
              </div>
              <button className="qst-remove-answer-btn" onClick={() => handleRemoveAnswer(index)}>
                <img src={'../assets/XCloseSVG.svg'} alt="Remove Answer" />
              </button>
            </div>
          ))}

          {/* Create new answer button and toggles */}
          <div className="qst-create-new-answer-row">
            <div className="qst-answer-label">{String.fromCharCode(65 + answers.length)}.</div>
            <button className="qst-create-new-answer-btn" onClick={handleAddAnswer}>
              <img src={'../assets/AddQuestionButtonSVG.svg'} alt="Add new answer" />
            </button>

            {/* Toggles for multiple choice only */}
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

          {/* Show regex only if open answers is allowed */}
          {allowOpenAnswers && (
            <div className="qst-regex-row">
              <div className="qst-regex-label">Regex.</div>
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
        <>
          {/* For single answer: no answer options, no toggles, regex always visible */}
          <div className="qst-regex-row">
            <div className="qst-regex-label">Regex.</div>
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
        </>
      )}
    </div>
  );
};

export default Question;
