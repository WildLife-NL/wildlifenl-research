import { Location } from './location';
import { Questionnaire } from './questionnaire';
import { Species } from './species';
import { Type } from './type';
import { UserApp } from './user';

export interface Interaction{

    ID: string;
    description: string;
    name: string;
    location: Location;
    questionnaire: Questionnaire;
    species: Species;
    speciesID: Species["ID"];
    timestamp: string;
    type: Type;
    typeID: Type["ID"];
    user: UserApp;
}