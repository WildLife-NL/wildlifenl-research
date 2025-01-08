export interface Role {
  ID: number;
  name: string;
}

export interface User {
  ID: string;
  name: string;
  email: string;
  roles: Role[];
}

export interface UserApp {
  ID: string;
  name: string;
}