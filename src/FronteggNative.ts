import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@frontegg/react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const FronteggRN = NativeModules.FronteggRN
  ? NativeModules.FronteggRN
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function getConstants() {
  return FronteggRN.getConstants();
}

export function login(loginHint?: string) {
  FronteggRN.login(loginHint)
    .then((data: any) => {
      console.log(data);
    })
    .catch((e: any) => {
      console.log(e);
    });
}

export function logout(): Promise<void> {
  return FronteggRN.logout();
}

export async function switchTenant(tenantId: string) {
  return FronteggRN.switchTenant(tenantId);
}

export async function refreshToken() {
  return FronteggRN.refreshToken();
}

/**
 * Starts a direct login action (e.g. a specific social provider) in the embedded login flow.
 *
 * Note on `ephemeralSession` / `additionalQueryParams`: these are currently honored on **iOS
 * only**. On Android the underlying native SDK's `directLoginAction` does not yet accept them,
 * so they are ignored there (tracked upstream in `frontegg-android-kotlin`). `ephemeralSession`
 * is inherently iOS-specific (it maps to the ASWebAuthenticationSession browser session).
 */
export async function directLoginAction(
  type: string,
  data: string,
  ephemeralSession: boolean = true,
  additionalQueryParams?: Record<string, string>
): Promise<void> {
  return FronteggRN.directLoginAction(
    type,
    data,
    ephemeralSession,
    additionalQueryParams
  );
}

export async function loginWithPasskeys(): Promise<void> {
  return FronteggRN.loginWithPasskeys();
}

export async function requestAuthorize(
  refreshToken: string,
  deviceTokenCookie?: string
) {
  return await FronteggRN.requestAuthorize(refreshToken, deviceTokenCookie);
}

/** Sentinel for optional maxAge on the native bridge (NSNumber must be nonnull on iOS). */
const NO_MAX_AGE = -1;

/** Max age in seconds for step-up validity (same semantics as native SDK). */
export async function isSteppedUp(maxAge?: number): Promise<boolean> {
  return FronteggRN.isSteppedUp(maxAge ?? NO_MAX_AGE);
}

/** Starts step-up authentication (MFA / re-auth). Max age in seconds. */
export async function stepUp(maxAge?: number): Promise<void> {
  return FronteggRN.stepUp(maxAge ?? NO_MAX_AGE);
}

export async function registerPasskeys(): Promise<void> {
  return FronteggRN.registerPasskeys();
}

export async function openAdminPortal(): Promise<void> {
  return FronteggRN.openAdminPortal();
}

export interface Entitlement {
  /** Whether the user is entitled to the requested feature/permission. */
  isEntitled: boolean;
  /**
   * Optional reason when `isEntitled` is false — e.g. `"NOT_AUTHENTICATED"`,
   * `"ENTITLEMENTS_NOT_LOADED"`, `"MISSING_FEATURE"`, `"MISSING_PERMISSION"`.
   */
  justification?: string | null;
}

/**
 * Loads the current user's entitlements into the SDK cache. Call this after
 * authentication (and again with `forceRefresh` to refetch) before reading
 * feature/permission entitlements. Resolves to `true` when entitlements loaded.
 */
export async function loadEntitlements(
  forceRefresh: boolean = false
): Promise<boolean> {
  return FronteggRN.loadEntitlements(forceRefresh);
}

/** Returns the on-device entitlement for a feature-flag key. */
export async function getFeatureEntitlement(key: string): Promise<Entitlement> {
  return FronteggRN.getFeatureEntitlement(key);
}

/** Returns the on-device entitlement for a permission key. */
export async function getPermissionEntitlement(
  key: string
): Promise<Entitlement> {
  return FronteggRN.getPermissionEntitlement(key);
}

function debounce<T extends (...args: any[]) => any>(func: T, waitFor: number) {
  let timeout: any;

  return function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    clearTimeout(timeout);
    return new Promise(
      (resolve: any) =>
        (timeout = setTimeout(() => resolve(func.apply(this, args)), waitFor))
    );
  };
}

export function listener(callback: (res: any) => any) {
  const CounterEvents = new NativeEventEmitter(FronteggRN);
  const debouncedFunc = debounce((res: any) => {
    callback(res);
  }, 50);
  const subs = CounterEvents.addListener('onFronteggAuthEvent', (res) => {
    debouncedFunc(res);
  });
  FronteggRN.subscribe();
  return subs;
}
