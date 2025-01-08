import { Answer } from "./answer";
import { Conveyance } from "./conveyance";
import { Interaction } from "./interaction";
import { Question } from "./question";


export interface ExperimentResponse {
    ID : string;
    answer : Answer;
    conveyance : Conveyance;
    interaction : Interaction;
    question: Question;
    text : string;
}