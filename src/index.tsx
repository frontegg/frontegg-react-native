export * from './FronteggWrapper';
export * from './hooks';

export {
  getConstants,
  login,
  logout,
  directLoginAction,
  switchTenant,
  refreshToken,
  loginWithPasskeys,
  registerPasskeys,
  requestAuthorize,
  isSteppedUp,
  stepUp,
  openAdminPortal,
  loadEntitlements,
  getFeatureEntitlement,
  getPermissionEntitlement,
} from './FronteggNative';
export type { Entitlement } from './FronteggNative';
