import { SetStateAction } from 'react';

export interface Props {
  valid: boolean | undefined;
  alreadyRedeemed: boolean | undefined;
  codeExpired: boolean | undefined;
}

export interface ResponseProps {
  response: Props | undefined;
  setResponse: React.Dispatch<SetStateAction<Props | undefined>>;
  setValidatedRedemptionCodes: React.Dispatch<SetStateAction<string[]>>;
  validatedRedemptionCodes: Array<string>;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address1?: string;
  address2?: string;
  roleKey: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  telephone?: string;
  externalCustomerId?: string;
  lang?: string;
  ref1?: string;
  ref2?: string;
  ref3?: string;
  ref4?: string;
  ref5?: string;
  ref6?: string;
  ref7?: string;
  ref8?: string;
  ref9?: string;
  ref10?: string;
}
