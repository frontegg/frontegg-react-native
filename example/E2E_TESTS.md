# Example App — Local E2E Tests

Local, instrumented end-to-end tests for the React Native example app. These
complement the external Nightwatch/Appium suite that lives in
`frontegg/e2e-system-tests` and runs in CI; the tests in this directory exist
so engineers can reproduce failures without the external repo and so that new
coverage for gaps flagged in
[`docs/E2E_REACT_NATIVE_TESTS_REVIEW.md`](../docs/E2E_REACT_NATIVE_TESTS_REVIEW.md)
(passkeys, refresh token) has a home.

The test suites mirror the patterns used by the sibling native SDKs:

- **Android** — UiAutomator + JUnit4, mirroring
  [`frontegg-android-kotlin/embedded/src/androidTest`](https://github.com/frontegg/frontegg-android-kotlin/tree/master/embedded/src/androidTest).
- **iOS** — XCUITest, mirroring
  [`frontegg-ios-swift/demo-embedded/demo-embedded-e2e`](https://github.com/frontegg/frontegg-ios-swift/tree/master/demo-embedded/demo-embedded-e2e).

Both suites drive the real Frontegg backend using whatever credentials the
example app is wired to in `example/android/app/build.gradle` and
`example/ios/Frontegg.plist` — the tests themselves are credential-agnostic
and only need the test-user values exported via the environment variables
listed below.

---

## Coverage (first pass)

| # | Scenario                             | Android file                   | iOS file                          |
|---|--------------------------------------|--------------------------------|-----------------------------------|
| 1 | Email + password login (happy path)  | `LoginViaEmailAndPasswordTest` | `LoginViaEmailAndPasswordTest`    |
| 2 | Login with wrong password            | `LoginViaEmailAndPasswordTest` | `LoginViaEmailAndPasswordTest`    |
| 3 | Logout                               | `LogoutTest`                   | `LogoutTest`                      |
| 4 | Social login (Google)                | `LoginViaGoogleTest`           | `LoginViaGoogleTest`              |
| 5 | Switch tenant                        | `SwitchTenantTest`             | `SwitchTenantTest`                |
| 6 | Refresh token button **(new)**       | `RefreshTokenTest`             | `RefreshTokenTest`                |
| 7 | Session restore after cold launch    | `SessionRestoreTest`           | `SessionRestoreTest`              |
| 8 | Request Authorization (step-up)      | `RequestAuthorizeTest`         | `RequestAuthorizeTest`            |
| 9 | Passkey register/login smoke **(new)** | `PasskeysRegisterTest` + `PasskeysLoginTest` | `PasskeysRegisterTest` + `PasskeysLoginTest` |

Test IDs on `HomeScreen.tsx` (`loginButton`, `logoutButton`,
`loginWithGoogleButton`, `requestAuthorizeButton`, `refreshTokenButton`,
`registerPasskeysButton`, `loginWithPasskeysButton`,
`tenantSwitchButton-$tenantId`, `accessTokenValue`, `userEmailValue`) are
shared between the two suites for selector stability — matching the
recommendation in `E2E_REACT_NATIVE_TESTS_REVIEW.md §5.3`.

---

## Required environment variables

All values below live in 1Password (`Frontegg / React Native E2E`). Export
them before invoking the Gradle/xcodebuild commands.

| Variable               | Used by        | Purpose                                            |
|------------------------|----------------|----------------------------------------------------|
| `LOGIN_EMAIL`          | both           | Test user email                                    |
| `LOGIN_PASSWORD`       | both           | Test user password                                 |
| `LOGIN_WRONG_PASSWORD` | both           | Any value other than the real password             |
| `TENANT_NAME_1`        | tenant-switch  | Name of the default tenant                         |
| `TENANT_NAME_2`        | tenant-switch  | Name of a second tenant the user belongs to        |
| `GOOGLE_EMAIL`         | Google login   | Dedicated test Google account email                |
| `GOOGLE_PASSWORD`      | Google login   | Dedicated test Google account password             |

---

## Running on Android

```bash
cd example/android

# Build the debug APKs (app + androidTest) and install them on a running
# emulator or connected device.
./gradlew :app:assembleDebug :app:assembleDebugAndroidTest

# Run the full suite. Instrumentation arguments become `Env.*` entries.
./gradlew :app:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.LOGIN_EMAIL="$LOGIN_EMAIL" \
  -Pandroid.testInstrumentationRunnerArguments.LOGIN_PASSWORD="$LOGIN_PASSWORD" \
  -Pandroid.testInstrumentationRunnerArguments.LOGIN_WRONG_PASSWORD="$LOGIN_WRONG_PASSWORD" \
  -Pandroid.testInstrumentationRunnerArguments.TENANT_NAME_1="$TENANT_NAME_1" \
  -Pandroid.testInstrumentationRunnerArguments.TENANT_NAME_2="$TENANT_NAME_2" \
  -Pandroid.testInstrumentationRunnerArguments.GOOGLE_EMAIL="$GOOGLE_EMAIL" \
  -Pandroid.testInstrumentationRunnerArguments.GOOGLE_PASSWORD="$GOOGLE_PASSWORD"

# Run a single test
./gradlew :app:connectedDebugAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=com.frontegg.demo.e2e.LogoutTest \
  -Pandroid.testInstrumentationRunnerArguments.LOGIN_EMAIL="$LOGIN_EMAIL" \
  -Pandroid.testInstrumentationRunnerArguments.LOGIN_PASSWORD="$LOGIN_PASSWORD"
```

The tests live under
`example/android/app/src/androidTest/java/com/frontegg/demo/e2e/` and use the
`androidx.test.uiautomator` helpers defined in `utils/UiTestInstrumentation.kt`.
The only dependency additions sit under `android/app/build.gradle` in the
`androidTestImplementation` block.

### Known limitations (Android)

- **Google login**: The emulator must have a Google account signed in, or the
  test must be run on a Google-APIs system image. Otherwise the Google auth
  sheet will short-circuit and `LoginViaGoogleTest` will fail at the
  "Open application" step.
- **Passkeys**: Without a credential-manager-provisioned device the smoke
  tests only verify the buttons are reachable. Stricter assertions need a
  separate pipeline — see the `e2e/` directory of
  `frontegg-android-kotlin` for a LocalMockAuthServer approach that can be
  ported when we need full coverage.

---

## Running on iOS

The Swift files live at `example/ios/ReactNativeExampleUITests/`. Before the
first run you must add a new **iOS UI Testing Bundle** target to
`ReactNativeExample.xcodeproj` that points at this directory:

1. Open `example/ios/ReactNativeExample.xcworkspace` in Xcode.
2. `File → New → Target… → iOS UI Testing Bundle`. Product name:
   `ReactNativeExampleUITests`. Target to be tested: `ReactNativeExample`.
3. In the new target, delete the auto-generated stub file and add the files
   already on disk from `example/ios/ReactNativeExampleUITests/`
   (`UITestCase.swift`, `LoginViaEmailAndPasswordTest.swift`, `LogoutTest.swift`,
   `LoginViaGoogleTest.swift`, `SwitchTenantTest.swift`, `RefreshTokenTest.swift`,
   `SessionRestoreTest.swift`, `RequestAuthorizeTest.swift`,
   `PasskeysRegisterTest.swift`, `PasskeysLoginTest.swift`, `Info.plist`).
4. Create a shared test plan (`ReactNativeExampleUITests.xctestplan`) that
   picks the UI test target — optional but recommended so CI can call
   `-testPlan ReactNativeExampleUITests`.

Once the target is registered, run the suite from the CLI:

```bash
cd example/ios

# Install pods first if you haven't already.
pod install

xcodebuild test \
  -workspace ReactNativeExample.xcworkspace \
  -scheme ReactNativeExample \
  -only-testing ReactNativeExampleUITests \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  LOGIN_EMAIL="$LOGIN_EMAIL" \
  LOGIN_PASSWORD="$LOGIN_PASSWORD" \
  LOGIN_WRONG_PASSWORD="$LOGIN_WRONG_PASSWORD" \
  TENANT_NAME_1="$TENANT_NAME_1" \
  TENANT_NAME_2="$TENANT_NAME_2" \
  GOOGLE_EMAIL="$GOOGLE_EMAIL" \
  GOOGLE_PASSWORD="$GOOGLE_PASSWORD"
```

Values appended to the `xcodebuild test` invocation are injected into
`ProcessInfo.processInfo.environment` for the test runner process, and
`UITestCase.launchApp()` forwards them to `XCUIApplication.launchEnvironment`
so each scenario can pull them with `env("LOGIN_EMAIL")`.

### Known limitations (iOS)

- **Google login**: Uses `ASWebAuthenticationSession`, which presents a
  system sheet outside of XCUITest's normal scope. The test handles the
  `Continue` prompt via the springboard proxy; some Google flows (captcha,
  new-device verification) cannot be automated and will require a
  dedicated test user with captchas disabled.
- **Passkeys**: Simulator has no biometric enrolment by default, so the
  register/login tests are smoke-level only. To go deeper, follow the
  `LocalMockAuthServer.swift` pattern in `frontegg-ios-swift` and wire it
  into a separate test scheme.

---

## CI

The reusable job at `.github/workflows/react-native-sdk-e2e.yml` still
triggers the external `e2e-system-tests` pipeline on every PR — that remains
the primary e2e gate. These local suites are intended for developer machines
and ad-hoc reproductions. When we're ready to promote them into CI, add a
new matrix job (iOS simulator + Android emulator) that installs the required
env vars from repository secrets and invokes the commands above. The mock
auth server port from the sibling SDKs is a prerequisite for making that
pipeline deterministic on flaky external Frontegg environments.
