import { createContext } from 'react';
import type { IUserProfile, ITenantsResponse } from '@frontegg/rest-api';

export type User = IUserProfile & {
  tenants: ITenantsResponse[];
  activeTenant: ITenantsResponse;
};

export interface FronteggState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  initializing: boolean;
  showLoader: boolean;
  logout: () => void;
  login: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
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
  switchTenant: () => Promise.resolve(),
};
const FronteggContext = createContext<FronteggState>(defaultFronteggState);

export default FronteggContext;
