# Frontegg React Native API Reference

Everything below is exported from `@frontegg/react-native`.

```tsx
import { FronteggWrapper, useAuth, login, logout } from '@frontegg/react-native';
```

## Components

| Component | Description |
|-----------|-------------|
| `FronteggWrapper` | Wraps your app and initialises the SDK. Everything below it can call `useAuth()`. Takes only `children`. |

## Hooks

### `useAuth()`

Returns the current `FronteggState`. Re-renders on every change — sign-in, sign-out, token refresh.

```tsx
const { isAuthenticated, user, isLoading } = useAuth();
```

| Field | Type | Description |
|-------|------|-------------|
| `isAuthenticated` | `boolean` | Whether a user is signed in. |
| `user` | `User \| null` | The signed-in user, including `tenants` and `activeTenant`. |
| `accessToken` | `string \| null` | Current access token. |
| `refreshToken` | `string \| null` | Current refresh token. |
| `refreshingToken` | `boolean` | A token refresh is in flight. |
| `isLoading` | `boolean` | An auth operation is in progress. |
| `initializing` | `boolean` | The SDK has not finished starting up. |
| `showLoader` | `boolean` | Convenience flag for whether to render a loading state. |

## Authentication

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `login` | `loginHint?: string`<br>or `options?: LoginOptions` | `Promise<void>` | Opens the login flow. `loginHint` pre-fills the identifier field. Resolves when login completes; rejects with a `FronteggLoginError`. See [Login box customization](#login-box-customization) for `LoginOptions`. |
| `logout` | None | `Promise<void>` | Signs the user out and clears stored credentials. |
| `loginWithPasskeys` | None | `Promise<void>` | Signs in with a passkey. Needs iOS 15+ or Android API 26+. |
| `registerPasskeys` | None | `Promise<void>` | Registers a passkey for the signed-in user. |
| `refreshToken` | None | `Promise<void>` | Forces a token refresh. The SDK also refreshes on its own in the background. |
| `requestAuthorize` | `refreshToken: string`<br>`deviceTokenCookie?: string` | `Promise<void>` | Establishes a session from an existing refresh token, without opening the login flow. |

### Social and direct login

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `directLoginAction` | `type: string`<br>`data: string`<br>`ephemeralSession = true`<br>`additionalQueryParams?: Record<string, string>` | `Promise<void>` | Starts a specific login action, such as a named social provider, inside the embedded flow. |

> `ephemeralSession` and `additionalQueryParams` are honoured on **iOS only**. Android's native
> `directLoginAction` does not accept them yet and ignores them. `ephemeralSession` is inherently
> iOS-specific — it maps to the `ASWebAuthenticationSession` browser session.


## Login box customization

`login()` accepts a `LoginOptions` object instead of a bare login hint, letting the app
theme and re-word the embedded login box at runtime — for a multi-brand app whose
appearance is resolved per brand and so cannot be expressed as static per-environment
configuration.

```ts
await login({
  loginHint: 'user@example.com',
  themeOptions: {
    loginBox: {
      palette: { primary: { main: '#3F6655' } },
      logo: { image: 'https://example.com/logo.png' },
    },
  },
  localizations: {
    en: { loginBox: { login: { title: 'Sign-in', continue: 'Log In' } } },
  },
});
```

| Field | Type | Description |
|-------|------|-------------|
| `loginHint` | `string` | Pre-fills the identifier field. |
| `themeOptions` | `Record<string, unknown> \| null` | Same shape as `themeV2` from `/frontegg/metadata?entityName=adminBox`. |
| `localizations` | `Record<string, unknown> \| null` | Same shape as `localizations` from the same endpoint. |

Values are deep-merged over the environment's configuration, so keys left unset keep
whatever the environment defines. Pass `null` to clear a previously set override; omit a
key to leave it unchanged.

Embedded mode only — hosted mode runs outside the app's WebView, so there is no
injection point.

## Step-up authentication

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `isSteppedUp` | `maxAge?: number` (seconds) | `Promise<boolean>` | Whether the session is currently stepped up. Omit `maxAge` for no age limit. |
| `stepUp` | `maxAge?: number` (seconds) | `Promise<void>` | Starts step-up authentication (MFA or re-auth). |

## Tenants

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `switchTenant` | `tenantId: string` | `Promise<void>` | Switches the active tenant. IDs come from `user.tenants`. |

## Entitlements

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `loadEntitlements` | `forceRefresh = false` | `Promise<boolean>` | Loads entitlements into the SDK cache. Call after authentication, and again with `forceRefresh` to refetch. Resolves `true` when loaded. |
| `getFeatureEntitlement` | `key: string` | `Promise<Entitlement>` | Entitlement for a feature-flag key, read from the cache. |
| `getPermissionEntitlement` | `key: string` | `Promise<Entitlement>` | Entitlement for a permission key, read from the cache. |

Both getters read the on-device cache, so call `loadEntitlements` first.

## Admin portal

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `openAdminPortal` | None | `Promise<void>` | Opens the Frontegg admin portal. |

## Configuration

| Method | Returns | Description |
|--------|---------|-------------|
| `getConstants` | `FronteggConstants` | The configuration the native SDK started with. |

## Types

### `Entitlement`

| Field | Type | Description |
|-------|------|-------------|
| `isEntitled` | `boolean` | Whether the user is entitled. |
| `justification` | `string \| null` | Why not, when `isEntitled` is false — for example `NOT_AUTHENTICATED`, `ENTITLEMENTS_NOT_LOADED`, `MISSING_FEATURE`, `MISSING_PERMISSION`. |

### `FronteggConstants`

| Field | Type | Description |
|-------|------|-------------|
| `baseUrl` | `string` | Your Frontegg domain. |
| `clientId` | `string` | Your Frontegg client ID. |
| `applicationId` | `string \| null` | Application ID, when configured. |
| `bundleId` | `string \| null` | The host app's bundle or package identifier. |
| `useAssetLinks` | `boolean \| null` | iOS only — the `useAssetLinks` key from `Frontegg.plist`. |
| `useAssetsLinks` | `boolean` | Android only — `FRONTEGG_USE_ASSETS_LINKS` from BuildConfig. |
| `useChromeCustomTabs` | `boolean` | Android only — `FRONTEGG_USE_CHROME_CUSTOM_TABS` from BuildConfig. |

### `FronteggLoginError`

`login()` rejects with this. It extends `Error`.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `FronteggLoginErrorCode` | Stable, cross-platform failure code. |
| `message` | `string` | Human-readable message. |
| `userCancelled` | `boolean` | Equivalent to `code === 'user_cancelled'`. |
| `nativeCode` | `string?` | Raw platform code, preserved for debugging. |
| `nativeMessage` | `string?` | Raw platform message. |

### `FronteggLoginErrorCode`

| Value | Meaning |
|-------|---------|
| `user_cancelled` | The user dismissed the login flow. |
| `oauth_failed` | The OAuth exchange failed — bad code exchange, invalid state, failed authentication. |
| `network` | The native SDK detected a network-level failure. |
| `unknown` | Not classifiable; inspect `nativeCode` and `nativeMessage`. |

The mapping is deliberately conservative: only failures the native layer can positively identify
get a specific code. Everything else is `unknown`, with the raw platform detail preserved.

```tsx
import { login, type FronteggLoginError } from '@frontegg/react-native';

try {
  await login();
} catch (e) {
  const error = e as FronteggLoginError;
  if (!error.userCancelled) {
    console.warn(error.code, error.nativeCode);
  }
}
```

### `User`

`IUserProfile` from `@frontegg/rest-api`, plus:

| Field | Type | Description |
|-------|------|-------------|
| `tenants` | `ITenantsResponse[]` | Every tenant the user belongs to. |
| `activeTenant` | `ITenantsResponse` | The currently active tenant. |
