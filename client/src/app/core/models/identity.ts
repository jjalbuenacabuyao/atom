/** Who the user wants to become; habits cast votes for identities. */
export interface Identity {
  id: string;
  statement: string;
  description: string;
  votes: number;
  habitCount: number;
  createdAt: string;
}

/** Compact identity embedded in other resources. */
export interface IdentityRef {
  id: string;
  statement: string;
}

export interface IdentityInput {
  statement: string;
  description: string;
}
