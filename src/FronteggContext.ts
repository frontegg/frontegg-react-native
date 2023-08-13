import { createContext } from 'react';
import type { IUserProfile } from '@frontegg/rest-api';

export interface FronteggState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUserProfile | null;
  initializing: boolean;
  showLoader: boolean;
  logout: () => void;
  login: () => void;
}

export const defaultFronteggState: FronteggState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  initializing: true,
  showLoader: true,
  logout: () => {},
  login: () => {},
};
const FronteggContext = createContext<FronteggState>(defaultFronteggState);

export default FronteggContext;
