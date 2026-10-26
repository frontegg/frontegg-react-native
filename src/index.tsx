export * from './FronteggWrapper';
export * from './hooks';

export {
  getConstants,
  login,
  logout,
  directLoginAction,
  switchTenant,
  refreshToken,
  getOrRefreshAccessToken,
  getRegions,
  initWithRegion,
  loginWithPasskeys,
  registerPasskeys,
  requestAuthorize,
  isSteppedUp,
  stepUp,
  openAdminPortal,
  loadEntitlements,
  getFeatureEntitlement,
  getPermissionEntitlement,
  isLoginBoxCustomizationSupported,
} from './FronteggNative';
export type {
  Entitlement,
  FronteggConstants,
  FronteggLoginError,
  FronteggLoginErrorCode,
  LoginBoxCustomization,
  LoginOptions,
} from './FronteggNative';
export type { RegionConfig } from './NativeFronteggRN';
