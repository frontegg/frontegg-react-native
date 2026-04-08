import XCTest

/// New coverage — passkey registration gap flagged in
/// docs/E2E_REACT_NATIVE_TESTS_REVIEW.md §4. Because registering a passkey
/// requires a system biometric prompt that cannot be driven reliably from
/// XCUITest on a plain simulator, this test only verifies the button is
/// reachable and the app survives the call. A stricter assertion can land
/// once passkey provisioning is wired into CI.
final class PasskeysRegisterTest: UITestCase {
    func test_register_passkeys_button_is_reachable() throws {
        launchApp()
        loginWithPassword(email: env("LOGIN_EMAIL"), password: env("LOGIN_PASSWORD"))

        let button = app.buttons["registerPasskeysButton"]
        waitFor(button, timeout: 10)
        button.tap()

        // Dismiss the system sheet if one appears.
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let cancel = springboard.buttons["Cancel"]
        if cancel.waitForExistence(timeout: 3) {
            cancel.tap()
        }

        XCTAssertTrue(app.buttons["logoutButton"].waitForExistence(timeout: 10))
        logoutAndAssert()
    }
}
