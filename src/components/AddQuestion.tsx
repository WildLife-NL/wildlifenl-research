import React from 'react';
import '../styles/AddQuestion.css';

interface AddQuestionProps {
  onClick: () => void;
}

const AddQuestion: React.FC<AddQuestionProps> = ({ onClick }) => {
  return (
    <div className="add-question-container">
      <button className="add-question-button" onClick={onClick}>
        <img src={'../assets/AddQuestionButtonSVG.svg'} alt="Add Question" />
      </button>
    </div>
  );
};

export default AddQuestion;
