import { createContext } from 'react';
import type { IUserProfile, ITenantsResponse } from '@frontegg/rest-api';

export type User = IUserProfile & {
  tenants: ITenantsResponse[];
  activeTenant: ITenantsResponse;
};

export interface FronteggState {
  accessToken: string | null;
  refreshToken: string | null;
  refreshingToken: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  initializing: boolean;
  showLoader: boolean;
}

export const defaultFronteggState: FronteggState = {
  accessToken: null,
  refreshToken: null,
  refreshingToken: false,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  initializing: true,
  showLoader: true,
};
const FronteggContext = createContext<FronteggState>(defaultFronteggState);

export default FronteggContext;
