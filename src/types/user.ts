export interface Role {
  ID: number;
  name: string;
}

export interface User {
  $schema: string;
  ID: string;
  name: string;
  email: string;
  roles: Role[];
}