import XCTest

/// New coverage — passkey login gap flagged in
/// docs/E2E_REACT_NATIVE_TESTS_REVIEW.md §4. Smoke test only: verifies the
/// button exists on the unauthenticated HomeScreen and tapping it does not
/// crash the app.
final class PasskeysLoginTest: UITestCase {
    func test_login_with_passkeys_button_is_reachable() throws {
        launchApp()

        let button = app.buttons["loginWithPasskeysButton"]
        waitFor(button, timeout: 10)
        button.tap()

        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let cancel = springboard.buttons["Cancel"]
        if cancel.waitForExistence(timeout: 3) {
            cancel.tap()
        }

        // App still alive, still on the unauthenticated HomeScreen.
        XCTAssertTrue(app.buttons["loginButton"].waitForExistence(timeout: 10))
    }
}
