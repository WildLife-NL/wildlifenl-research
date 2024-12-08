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
  id,                 // Destructure 'id' from props
  questionIndex,
  isMultipleChoice,
  onRemoveQuestion,
}) => {
  // State for question text and description
  const [questionText, setQuestionText] = useState('');
  const [questionDescription, setQuestionDescription] = useState('');

  // State for answer options
  const [answers, setAnswers] = useState<AnswerOption[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
  ]);

  // State for toggles
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);
  const [allowOpenAnswers, setAllowOpenAnswers] = useState(false);

  // Regex input state
  const [regexValue, setRegexValue] = useState('');

  // Handle removing the entire question
  const handleRemoveQuestion = () => {
    onRemoveQuestion(id); // Use 'id' instead of 'questionIndex'
  };

  // Handle changing an answer text
  const handleAnswerChange = (index: number, newText: string) => {
    const newAnswers = [...answers];
    newAnswers[index].text = newText;
    setAnswers(newAnswers);
  };

  // Handle removing a single answer
  const handleRemoveAnswer = (index: number) => {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1);

    // Re-label answers from A, B, C... based on new order
    const updatedAnswers = newAnswers.map((ans, i) => {
      return { ...ans, id: String.fromCharCode(65 + i) }; // 65 is 'A'
    });
    setAnswers(updatedAnswers);
  };

  // Handle adding a new answer
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

      <div className="qst-create-new-answer-row">
        <div className="qst-answer-label">{String.fromCharCode(65 + answers.length)}.</div>
        <button className="qst-create-new-answer-btn" onClick={handleAddAnswer}>
          <img src={'../assets/AddQuestionButtonSVG.svg'} alt="Add new answer" />
        </button>

        {/* Toggles placed on the same line as D. Adjust as needed */}
        <div className="qst-toggle-row">
          <button
            className="qst-toggle-btn"
            onClick={() => setAllowMultipleAnswers(!allowMultipleAnswers)}
          >
            <img
              src={allowMultipleAnswers ? '../assets/RadioBoxFilledInSVG.svg' : '../assets/RadioBoxNotFilledSVG.svg'}
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
              src={allowOpenAnswers ? '../assets/RadioBoxFilledInSVG.svg' : '../assets/RadioBoxNotFilledSVG.svg'}
              alt="Toggle open answers"
            />
          </button>
          <div className="qst-toggle-label">Allow open answers</div>
        </div>
      </div>

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
    </div>
  );
};

export default Question;
