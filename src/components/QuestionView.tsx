import { Question } from "../types/question";
import { useNavigate } from 'react-router-dom';
import '../styles/QuestionView.css';
import { Experiment } from '../types/experiment';
import { User } from '../types/user'; // Import User

interface QuestionViewProps {
  fields: Question[];
  experiment: Experiment; // Changed from experimentID: string
  loggedInUser?: User; // Added loggedInUser prop
}

const getStatus = (startDate: string, endDate?: string | null): string => {
  const today = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  if (start > today) {
    return 'Upcoming';
  } else if (end && end < today) {
    return 'Completed';
  } else {
    return 'Live';
  }
};

const QuestionView: React.FC<QuestionViewProps> = ({ fields, experiment, loggedInUser }) => { // Updated props
  const navigate = useNavigate();
  const status = getStatus(experiment.start, experiment.end);
  const isCreator = loggedInUser ? experiment.user.ID === loggedInUser.ID : false; // Determine if user is creator

  // Identify duplicate indices
  const indexCount: { [key: number]: number } = {};
  fields.forEach(question => {
    indexCount[question.index] = (indexCount[question.index] || 0) + 1;
  });

  return (
    <div className="questionnaire">
      {fields.map((question) => {
        const isDuplicate = indexCount[question.index] > 1;
        const questionIndexText = isDuplicate
          ? `Question ${question.index}*.`
          : `Question ${question.index}.`;

        const hasAnswers = question.answers && question.answers.length > 0;
        const hasOpenResponse = question.allowOpenResponse;

        let answeringMethodology = '';
        if (hasAnswers) {
          answeringMethodology = question.allowMultipleResponse ? 'Multiple responses allowed' : 'Single response allowed';
        }

        // Map indices to letters
        const uniqueIndices: number[] = [];
        question.answers?.forEach((answer) => {
          if (!uniqueIndices.includes(answer.index)) {
            uniqueIndices.push(answer.index);
          }
        });

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const indexToLetterMap: { [key: number]: string } = {};
        let letterSuffix = '';
        let letterIndex = 0;
        uniqueIndices.forEach((index) => {
          if (letterIndex < letters.length) {
            indexToLetterMap[index] = letters[letterIndex] + letterSuffix;
            letterIndex++;
          } else {
            letterIndex = 0;
            letterSuffix = letterSuffix === '' ? '1' : (parseInt(letterSuffix) + 1).toString();
            indexToLetterMap[index] = letters[letterIndex] + letterSuffix;
            letterIndex++;
          }
        });

        return (
          <div key={question.ID} className="question-container">
            {/* Box */}
            <div className="question-box">
              

              {/* Question Title Group */}
              <div className="question-title-group">
                <div className="question-index text-style">{questionIndexText}</div>
                <div className="question-title text-style">{question.text}</div>
                {question.description && (
                  <div className="question-description text-style">{question.description}</div>
                )}
              </div>

              {/* Multiple Choice Group */}
              {hasAnswers && (
  <div className="multiple-choice-group">
    {question.answers.map((answer, idx) => {
      // Decide if this user can link messages

      // Default: black icon, clickable
      let messageIcon = "/assets/MessageBlackSVG.svg";
      let messageTitle = "Create a message that is linked to this answer";
      let messageOnClick = () => {
        navigate(`/MessageCreationB/${experiment.ID}`, {
          state: { answerID: answer.ID, answerText: answer.text }
        });
      };

      // If NOT creator
      if (!isCreator) {
        messageIcon = "/assets/MessageGraySVG.svg";
        messageTitle = "Messages can only be linked by the owner of the experiment before it goes live";
        messageOnClick = () => {}; // No action
      } 
      // Else if it IS creator, but experiment is not upcoming
      else if (status !== "Upcoming") {
        messageIcon = "/assets/MessageGraySVG.svg";
        messageTitle = "Messages can only be linked before the experiment goes live";
        messageOnClick = () => {}; // No action
      }

      return (
        <div key={idx} className="answer-option">
          <div className="answer-left">
            <div className="answer-letter text-style">
              {indexToLetterMap[answer.index]}.
            </div>
            <div className="answer-text text-style">{answer.text}</div>
          </div>
          <div className="message-button-container">
            <img
              src={messageIcon}
              alt="Add Message"
              className="message-button-svg"
              onClick={messageOnClick}
              title={messageTitle}
            />
          </div>
        </div>
      );
    })}
  </div>
)}


              {/* Regex Group */}
              {hasOpenResponse && (
                <div className="regex-group">
                  <div className="regex-label text-style">Regex:</div>
                  <div className="regex-input text-style">
                    {question.openResponseFormat || 'None'}
                  </div>
                </div>
              )}

              {/* Answering Methodology */}
              {answeringMethodology && (
                <div className="answering-methodology text-style">
                  {answeringMethodology}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestionView;
