export type TokenType = 'admin' | 'member';

export interface RequestUser {
  sub: string;
  role: string;
  tokenType: TokenType;
  familyId?: string;
}
