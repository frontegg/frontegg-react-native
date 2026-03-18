# Review: React Native E2E Tests (e2e-system-tests/mobile-sdk)

This document reviews the React Native tests in the **e2e-system-tests** repo (`mobile-sdk/nightwatch/mobile-app-tests/react-native-sdk/`) against the **frontegg-react-native** SDK and its example app.

---

## 1. Overview

| Item | Location / Details |
|------|-------------------|
| **E2E repo** | `e2e-system-tests/mobile-sdk` |
| **App under test** | `frontegg-react-native/example` (iOS & Android) |
| **Framework** | Nightwatch.js + Appium |
| **Environments** | `app.ios.react-native-sdk.hosted`, `app.android.react-native-sdk.hosted` |

The tests assume the example app is built from `frontegg-react-native/example` and that the e2e repo can resolve the app binary via relative paths (`../../frontegg-react-native`, `../frontegg-react-native`, or `frontegg-react-native` from cwd).

---

## 2. Credentials Alignment

- **E2E auth-utils** (`auth-utils.ts`) uses:
  - `clientId`: `5f493de4-01c5-4a61-8642-fca650a6a9dc`
  - `serviceGateway`: `https://app-x4gr8g28fxr5.frontegg.com`
- **Example app** (after your recent change) uses the same:
  - iOS: `Frontegg.plist` — `baseUrl`, `clientId`
  - Android: `build.gradle` — `fronteggDomain`, `fronteggClientId`

So the e2e suite and the example app are aligned on the same Frontegg app. No change needed in e2e for credentials.

---

## 3. Page Object & Selectors vs Example App

### 3.1 Start page (unauthenticated)

| E2E selector | Example app (HomeScreen) | Notes |
|--------------|-------------------------|--------|
| Login button: `@name="Login"` (iOS) / `@text="Login"` (Android) | `<Button title={…'Logout' : 'Login'} />` | Matches. |
| Title: "React Native Example" | `<Text>React Native Example</Text>` | Matches. |
| "Not Logged in" | `<Text>… state.user ? state.user.email : 'Not Logged in'</Text>` | Matches. |

### 3.2 User page (authenticated)

| E2E selector | Example app (HomeScreen when authenticated) | Notes |
|--------------|---------------------------------------------|--------|
| Logout button | `<Button title="Logout" />` | Matches. |
| Request Authorization button | `<Button title="Request Authorization" />` | Matches. |
| Refresh Token button | `<Button title="Refresh Token" />` | Selector exists in `ReactNativeSDKUserPageSelectors` but there is no `clickRefreshToken()` in the page object (only used if needed later). |
| User email visible | XPath contains email | App shows `state.user.email`; assertion is correct. |

React Native’s default accessibility behavior (button `title` → accessibility name/label) matches the XPath-based selectors. No `testID` or explicit `accessibilityLabel` is required for current coverage.

---

## 4. Test Coverage vs Example App Features

| Example app feature | E2E test coverage | Comment |
|--------------------|--------------------|--------|
| Login (email/password) | Yes — `react-native-sdk-login-test.ts` | Full flow: start → Login → WebView login → user page. |
| Logout | Yes — `react-native-sdk-logout-test.ts` | Login then logout, assert back on start page. |
| Sign up (concept) | Partial — `react-native-sdk-signup-test.ts` | See §5.1. |
| Magic link | Yes — `react-native-sdk-magic-link-test.ts` | Uses MagicLink strategy + Mailosaur. |
| MFA (authenticator) | Yes — `react-native-sdk-mfa-authenticator-test.ts` | — |
| MFA (SMS) | Yes — `react-native-sdk-mfa-sms-test.ts` | — |
| Password complexity | Yes — `react-native-sdk-login-password-complexity-test.ts` | — |
| Step-up / Request Authorization | Yes — `react-native-sdk-step-up-test.ts` | Clicks "Request Authorization", asserts user page. |
| User profile (email/name on screen) | Yes — `react-native-sdk-user-profile-test.ts` | Asserts user info displayed. |
| Tenant switching | Yes — `react-native-sdk-tenant-switching-test.ts` | Asserts "Active Tenant" text; handles case where tenant UI is absent. |
| Social login (e.g. Google) | Yes — `react-native-sdk-social-login-test.ts` | — |
| Passkeys (Register / Login with Passkeys) | No | Buttons exist in example app; no dedicated e2e yet. |
| Refresh Token button | No | Selector exists; no test that explicitly uses it. |

So: core auth, MFA, step-up, tenant, and social flows are covered; Passkeys and “Refresh Token” are not.

---

## 5. Findings & Recommendations

### 5.1 Signup test semantics

- **File:** `react-native-sdk-signup-test.ts`
- **Current flow:** `authUtils.createUser()` (API) → launch app → tap Login → in WebView call `iOSLoginPage.login(newUser.email, newUser.password)` / `androidLoginPage.login(...)`.
- So the test exercises “log in with a newly created user,” not the hosted signup UI (no “Sign up” link, no signup form).
- **Recommendation:** Either rename to something like “Newly created user can log in” or extend the test to open the signup flow in the WebView and complete signup there, then assert on the user page.

### 5.2 App path resolution

- **nightwatch.conf.js** resolves the React Native app from:
  - `REACT_NATIVE_SDK_HOSTED_IOS_APP_PATH` / `REACT_NATIVE_SDK_HOSTED_ANDROID_APP_PATH`, or
  - Relative paths under `frontegg-react-native` (e.g. `example/ios/build/.../ReactNativeExample.app`, `example/android/app/build/outputs/apk/debug/app-debug.apk`).
- If the e2e repo and `frontegg-react-native` are not in the expected relative layout, tests will fail at session start. The README in `mobile-sdk` does not document that the React Native example app must be built and where it must live relative to the e2e repo.
- **Recommendation:** Document in `e2e-system-tests/mobile-sdk/README.md` (or a dedicated React Native section):
  - Build the app from `frontegg-react-native/example` (iOS and/or Android).
  - Expected relative location of `frontegg-react-native` (e.g. sibling of `e2e-system-tests`) or set `REACT_NATIVE_SDK_HOSTED_*` to absolute paths.

### 5.3 Optional: more stable selectors

- Selectors are text-based (button title / static text). They are correct for the current example app but can break if copy or i18n changes.
- **Recommendation (optional):** In the example app, add `testID` (and optionally `accessibilityLabel`) to key elements (e.g. `Login`, `Logout`, `Request Authorization`), and in e2e use `testID`-based or accessibility selectors where the framework supports it, to reduce fragility.

### 5.4 Unused selector

- `ReactNativeSDKUserPageSelectors.REFRESH_TOKEN_BUTTON_*` is defined but the page object has no `clickRefreshToken()`. No test uses it.
- **Recommendation:** Either add a small test that taps “Refresh Token” and asserts token/state (if useful), or remove the selector to avoid dead code.

### 5.5 Step-up test assertion

- **File:** `react-native-sdk-step-up-test.ts`
- After `clickRequestAuthorize()`, the test only checks that the user page is still loaded. The example app’s `requestAuthorize` can succeed or fail (e.g. 403); the test does not assert on success/failure or any step-up UI.
- **Recommendation:** If step-up behavior is important, consider asserting on a visible outcome (e.g. success message or error) or on a specific screen after authorization, depending on product requirements.

---

## 6. Summary

- **Credentials:** E2E and the example app use the same Frontegg app (`app-x4gr8g28fxr5.frontegg.com`, clientId `5f493de4-01c5-4a61-8642-fca650a6a9dc`). No e2e credential change needed.
- **Selectors:** Aligned with the example app’s HomeScreen (Login/Logout, Request Authorization, title, “Not Logged in”, user email). No breaking mismatch found.
- **Coverage:** Login, logout, magic link, MFA, password complexity, step-up, user profile, tenant switching, and social login are covered; Passkeys and “Refresh Token” are not.
- **Improvements:** Clarify signup test intent or flow (§5.1), document app build and path for React Native (§5.2), optionally add testID/accessibility and use Refresh Token or remove its selector (§5.3–5.4), and optionally tighten step-up assertions (§5.5).
