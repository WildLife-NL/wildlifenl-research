import { Question } from "../types/question";
import '../styles/QuestionView.css';

interface QuestionViewProps {
  fields: Question[];
}

const QuestionView: React.FC<QuestionViewProps> = ({ fields }) => {
  return (
    <div className="questionnaire">
      {fields.map((question, idx) => {
        const isLastQuestion = idx === fields.length - 1;
        const questionIndexText = isLastQuestion
          ? `Question ${question.index}*.`
          : `Question ${question.index}.`;

        const hasAnswers = question.answers && question.answers.length > 0;
        const hasOpenResponse = question.allowOpenResponse;

        let answeringMethodology = '';
        if (hasAnswers) {
          answeringMethodology = question.allowMultipleResponse ? 'M' : 'S';
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
              {/* View Question Button */}
              <div className="view-question-button">
                <img
                  src="/assets/ViewQuestionButtonSVG.svg"
                  alt="View Question"
                  className="view-question-svg"
                />
              </div>

              {/* Question Title Group */}
              <div className="question-title-group">
                <div className="question-index text-style">{questionIndexText}</div>
                <div className="question-title text-style">{question.text}</div>
              </div>

              {/* Multiple Choice Group */}
              {hasAnswers && (
                <div className="multiple-choice-group">
                  {question.answers.map((answer, idx) => (
                    <div key={idx} className="answer-option">
                      <div className="answer-letter text-style">
                        {indexToLetterMap[answer.index]}.
                      </div>
                      <div className="answer-text text-style">{answer.text}</div>
                    </div>
                  ))}
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