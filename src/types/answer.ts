export interface AddAnswer{
  index: number;
  nextQuestionID: string;
  questionId: string;
  text: string;
}

export interface Answer{
  ID: string;
  index: number;
  nextQuestionID: string;
  questionId: string;
  text: string;
}