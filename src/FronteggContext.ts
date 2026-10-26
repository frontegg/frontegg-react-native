import { createContext } from 'react';
import type { IUserProfile, ITenantsResponse } from '@frontegg/rest-api';
import type { RegionConfig } from './NativeFronteggRN';

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
  selectedRegion: RegionConfig | null;
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
  selectedRegion: null,
};
const FronteggContext = createContext<FronteggState>(defaultFronteggState);

export default FronteggContext;
