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

export interface FronteggConstants {
  baseUrl: string;
  clientId: string;
  applicationId?: string | null;
  bundleId?: string | null;
  /**
   * iOS only: the `useAssetLinks` key from `Frontegg.plist`, when present
   * (companion to frontegg-ios-swift#293 — the wrapper forwards the plist as-is,
   * so the key reaches the native SDK once it supports it). `null`/`undefined`
   * when the key is not set or on Android.
   */
  useAssetLinks?: boolean | null;
  /** Android only: `FRONTEGG_USE_ASSETS_LINKS` from the host app's BuildConfig. */
  useAssetsLinks?: boolean;
  /** Android only: `FRONTEGG_USE_CHROME_CUSTOM_TABS` from the host app's BuildConfig. */
  useChromeCustomTabs?: boolean;
}

export function getConstants(): FronteggConstants {
  return FronteggRN.getConstants();
}

/**
 * Stable, cross-platform rejection codes for `login()` (issue #110).
 *
 * - `user_cancelled` — the user dismissed/cancelled the login flow.
 * - `oauth_failed` — the OAuth/hosted-login exchange failed (bad code exchange,
 *   invalid OAuth state, failed authentication, etc.).
 * - `network` — a network-level failure was detected by the native SDK.
 * - `unknown` — anything the wrapper cannot classify; inspect `nativeCode`.
 *
 * Mapping is conservative: only failures the native layer can positively
 * identify get a specific code, everything else is `unknown` with the raw
 * platform details preserved on `nativeCode` / `nativeMessage`.
 */
export type FronteggLoginErrorCode =
  | 'user_cancelled'
  | 'oauth_failed'
  | 'network'
  | 'unknown';

/** The error `login()` rejects with (issue #110). */
export interface FronteggLoginError extends Error {
  code: FronteggLoginErrorCode;
  message: string;
  /** Convenience flag, equivalent to `code === 'user_cancelled'`. */
  userCancelled: boolean;
  /**
   * Raw platform error code, preserved for debugging/telemetry:
   * iOS — `FronteggError` failure reason (e.g. `"operationCanceled"`,
   * `"couldNotExchangeToken"`); Android — the SDK exception class name
   * (e.g. `"CanceledByUserException"`).
   */
  nativeCode?: string;
  /** Raw platform error message. */
  nativeMessage?: string;
}

const LOGIN_ERROR_CODES: ReadonlyArray<FronteggLoginErrorCode> = [
  'user_cancelled',
  'oauth_failed',
  'network',
  'unknown',
];

/**
 * Normalizes a native `login()` rejection into a `FronteggLoginError`.
 * The native bridges already reject with the stable codes above; this keeps
 * the shape guaranteed even for older native layers or unexpected errors.
 * Exported for testing.
 */
export function normalizeLoginError(e: unknown): FronteggLoginError {
  const raw = (e ?? {}) as {
    code?: unknown;
    message?: unknown;
    userInfo?: { nativeCode?: unknown; nativeMessage?: unknown };
  };
  const code: FronteggLoginErrorCode = LOGIN_ERROR_CODES.includes(
    raw.code as FronteggLoginErrorCode
  )
    ? (raw.code as FronteggLoginErrorCode)
    : 'unknown';
  const message =
    typeof raw.message === 'string' && raw.message.length > 0
      ? raw.message
      : 'Login failed';

  const error = new Error(message) as FronteggLoginError;
  error.name = 'FronteggLoginError';
  error.code = code;
  error.userCancelled = code === 'user_cancelled';
  if (typeof raw.userInfo?.nativeCode === 'string') {
    error.nativeCode = raw.userInfo.nativeCode;
  } else if (typeof raw.code === 'string' && code === 'unknown') {
    // Older native layers reject with the raw platform code directly.
    error.nativeCode = raw.code;
  }
  if (typeof raw.userInfo?.nativeMessage === 'string') {
    error.nativeMessage = raw.userInfo.nativeMessage;
  }
  return error;
}

/**
 * Runtime overrides for the embedded login box (issue #127).
 *
 * Login-box configuration is scoped to a Frontegg environment, which cannot
 * express appearance that is only known at runtime — for example a multi-brand
 * app that resolves each brand's logo and colours from its own backend. These
 * options are deep-merged over the environment's configuration, so keys left
 * unset keep whatever the environment already defines.
 *
 * Pass `null` for either key to clear a previously set override and fall back to
 * the environment's own configuration. Omitting a key leaves it unchanged.
 *
 * Embedded mode only; hosted mode runs outside the app's WebView.
 */
export interface LoginBoxCustomization {
  /**
   * Same shape as `themeV2` from `/frontegg/metadata?entityName=adminBox`,
   * e.g. `{ loginBox: { palette: { primary: { main: '#3F6655' } } } }`.
   */
  themeOptions?: Record<string, unknown> | null;
  /**
   * Same shape as `localizations` from `/frontegg/metadata?entityName=adminBox`,
   * e.g. `{ en: { loginBox: { login: { title: 'Sign-in' } } } }`.
   */
  localizations?: Record<string, unknown> | null;
}

/** Options accepted by {@link login}. */
export interface LoginOptions extends LoginBoxCustomization {
  /** Pre-fills the email field on the login box. */
  loginHint?: string;
}

/**
 * Opens the Frontegg login flow. Resolves when login completes successfully;
 * rejects with a {@link FronteggLoginError} when it fails or is cancelled.
 *
 * Accepts either a login hint (the original signature) or a {@link LoginOptions}
 * object:
 *
 * ```ts
 * await login('user@example.com');
 * await login({
 *   loginHint: 'user@example.com',
 *   themeOptions: { loginBox: { palette: { primary: { main: '#3F6655' } } } },
 * });
 * ```
 */
export async function login(
  loginHintOrOptions?: string | LoginOptions
): Promise<void> {
  const options: LoginOptions =
    typeof loginHintOrOptions === 'string'
      ? { loginHint: loginHintOrOptions }
      : loginHintOrOptions ?? {};

  const { loginHint } = options;

  // Every call fully determines the login box appearance. A key the caller omitted is
  // sent as null and clears any previous value, so one brand's theme cannot leak into
  // the next brand's login.
  const customization = {
    themeOptions: options.themeOptions ?? null,
    localizations: options.localizations ?? null,
  };
  const customized =
    customization.themeOptions !== null || customization.localizations !== null;

  // FR-25938: previously fire-and-forget (swallowed the result in console.log), so callers could
  // neither await completion nor observe a cancelled/failed login. Return the promise so it is
  // awaitable and rejections propagate.
  try {
    if (typeof FronteggRN.loginWithOptions === 'function') {
      return await FronteggRN.loginWithOptions(loginHint, customization);
    }

    // Older native binary (a JS-only update). Sign-in still works; only the overrides
    // are unavailable, so say so rather than failing the login.
    if (customized) {
      console.warn(
        '[frontegg] login box customization needs a newer native SDK; signing in without it'
      );
    }
    return await FronteggRN.login(loginHint);
  } catch (e) {
    throw normalizeLoginError(e);
  }
}

/**
 * Whether this device can apply login box overrides. Android WebView providers without
 * `DOCUMENT_START_SCRIPT` cannot, and the box then renders the environment's own
 * branding — check this before relying on per-brand appearance. Always true on iOS.
 */
export async function isLoginBoxCustomizationSupported(): Promise<boolean> {
  if (typeof FronteggRN.isLoginBoxCustomizationSupported !== 'function') {
    return false;
  }
  return FronteggRN.isLoginBoxCustomizationSupported();
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
