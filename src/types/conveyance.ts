import { Message } from "./message";
import { Alarm } from "./alarm";
import { UserApp } from "./user";
import { Animal } from "./animal";


export interface Conveyance {
  ID : string;
  alarm : Alarm;
  animal : Animal;
  message : Message;
  response : Response;
  timestamp : string;
  user : UserApp;
}