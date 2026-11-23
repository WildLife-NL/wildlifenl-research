// Old routes from before the redesign, kept so bookmarks and in-app links still land on the right page
import { Navigate, useLocation, useParams } from 'react-router-dom';

// /questionedit and /questioncreation carried the questionnaire in router state, the builder now lives at /questionnaire/:id
export const QuestionEditorRedirect: React.FC = () => {
  const location = useLocation();
  const questionnaireID = location.state?.questionnaire?.ID;
  return questionnaireID ? (
    <Navigate to={`/questionnaire/${questionnaireID}`} replace state={location.state} />
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

// /messagecreationb/:id was the composer for answer-triggered messages, the single composer now preselects the answer
export const AnswerMessageRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const answerID = location.state?.answer?.ID ?? location.state?.answerID;
  return <Navigate to={`/messagecreation/${id}`} replace state={{ ...location.state, trigger: 'answer', answerID }} />;
};

// /message/:id without a message ID opens the experiment's Messages tab
export const MessageListRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const messageID = location.state?.message?.ID;
  return messageID ? (
    <Navigate to={`/message/${id}/${messageID}`} replace state={location.state} />
  ) : (
    <Navigate to={`/messagedashboard/${id}`} replace state={location.state} />
  );
};
