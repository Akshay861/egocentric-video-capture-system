export type IdentifierType = 'email' | 'phone';

export interface AuthSession {
  token: string;
  workerId: string;
  identifier: string;
  identifierType: IdentifierType;
  loggedInAt: string;
}

export interface LoginInput {
  identifier: string;
  identifierType: IdentifierType;
}
