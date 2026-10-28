# Change Log

## Unreleased

Native SDKs: iOS FronteggSwift 1.3.24, Android 1.3.43.

Features:

- Expo config plugin. Add `@frontegg/react-native` to `plugins` in `app.json` and run `npx expo prebuild` to generate the native iOS and Android setup, including multi-region.
- New architecture (TurboModule) support. The module works on both the old and the new architecture.
- Multi-region: `getRegions()`, `initWithRegion(regionKey)`, `useAuth().selectedRegion`, and `isRegional` / `regionData` in `getConstants()`. Bare Android apps call `FronteggRegions.initFromBuildConfig(this)` in `MainApplication.onCreate`.
- `getOrRefreshAccessToken()` returns an access token valid for more than 15 seconds and refreshes it first when needed. Use it before API calls after the app resumes.

Notes:

- CI and `.nvmrc` use Node 22.
- An over-the-air JS update running on an older native binary fails on the new methods.

## [v1.2.25](https://github.com/frontegg/frontegg-react-native/compare/v1.2.24...v1.2.25) (2026-10-14)

- Native SDKs: iOS FronteggSwift 1.3.24, Android 1.3.43.
- Docs site upgraded to docsify 5.0.0 with pinned CDN versions.

## [v1.2.24](https://github.com/frontegg/frontegg-react-native/compare/v1.2.23...v1.2.24) (2026-10-08)

- `login()` accepts a login box footer (FR-27245).
- Native SDKs: iOS FronteggSwift 1.3.23, Android 1.3.42.

## [v1.2.23](https://github.com/frontegg/frontegg-react-native/compare/v1.2.22...v1.2.23) (2026-09-17)

- `login()` accepts login box theme and localization overrides.
- Native SDKs: iOS FronteggSwift 1.3.21, Android 1.3.41.
- Docs: rebuilt landing page and repaired site navigation.

## [v1.2.22](https://github.com/frontegg/frontegg-react-native/compare/v1.2.21...v1.2.22) (2026-08-10)

- iOS: FronteggSwift 1.3.17. Fixes social sign-in failing with "Failed to get extract code" after a successful authentication (FR-26132).

## [v1.2.21](https://github.com/frontegg/frontegg-react-native/compare/v1.2.20...v1.2.21) (2026-07-30)

- `login()` rejects with a typed `FronteggLoginError` (`code`: `user_cancelled`, `oauth_failed`, `network` or `unknown`) on both platforms.
- iOS: `useAssetLinks` in `Frontegg.plist` is exposed through `getConstants()`.
- iOS: fixed Xcode 26 archives failing on a duplicate `Sentry.xcframework` signature.
- iOS: FronteggSwift 1.3.14. Fixes the embedded login box hanging after a failed or cancelled passkey sign-in (FR-26113).

## [v1.2.20](https://github.com/frontegg/frontegg-react-native/compare/v1.2.19...v1.2.20) (2026-07-24)

- `logout()` returns a promise that resolves when the session has ended, with a 10-second fallback.
- Android: `refreshToken()` waits for the refresh to finish instead of resolving with a stale token (FR-25937).
- Android: `login`, `directLoginAction`, `loginWithPasskeys` and `registerPasskeys` reject with `NO_ACTIVITY` instead of crashing when there is no activity (FR-25939).
- `login()` and `switchTenant()` reject on failure instead of reporting success (FR-25938).
- iOS: re-subscribing no longer duplicates auth state listeners (FR-25940), and attaching a listener always replays the current auth state.
- iOS: FronteggSwift is declared through React Native's `spm_dependency` for workspaces with several app targets.
- Native SDKs: iOS FronteggSwift 1.3.13, Android 1.3.36.

## [v1.2.19](https://github.com/frontegg/frontegg-react-native/compare/v1.2.18...v1.2.19) (2026-07-14)

- Android: `directLoginAction` accepts the same four arguments as iOS. `ephemeralSession` and `additionalQueryParams` are ignored on Android.
- Native SDKs: iOS FronteggSwift 1.3.11, Android 1.3.35. Fixes embedded step-up showing a blank page.

## [v1.2.18](https://github.com/frontegg/frontegg-react-native/compare/v1.2.17...v1.2.18) (2026-07-01)

- Entitlements: `loadEntitlements(forceRefresh?)`, `getFeatureEntitlement(key)` and `getPermissionEntitlement(key)`.
- Android: `stepUp` and `openAdminPortal` use `reactApplicationContext.currentActivity`.

## [v1.2.17](https://github.com/frontegg/frontegg-react-native/compare/v1.2.16...v1.2.17) (2026-06-29)

- `openAdminPortal()`.
- iOS: FronteggSwift is integrated through Swift Package Manager.
- Android: JVM target 17, for React Native 0.80 and later.
- Android: `reactApplicationContext.currentActivity` replaces the deprecated `currentActivity` (React Native 0.80 and later).
- Android: `BuildConfig` is found when `applicationId` differs from `namespace`.
- Native SDKs: iOS FronteggSwift 1.3.10, Android 1.3.34.

Earlier releases are listed under the repository's [tags](https://github.com/frontegg/frontegg-react-native/tags).
