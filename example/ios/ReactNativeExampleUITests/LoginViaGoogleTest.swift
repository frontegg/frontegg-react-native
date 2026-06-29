import XCTest

/// Social login smoke test. Verifies the button is reachable and
/// the app survives tapping it.
final class LoginViaGoogleTest: UITestCase {
    func test_social_login_button_is_reachable() throws {
        launchApp()
        let button = app.buttons["loginWithGoogleButton"]
        waitFor(button, timeout: 10)
        button.tap()

        // The social flow opens ASWebAuthenticationSession.
        // Dismiss the system consent sheet if it appears.
        acceptSystemDialogIfNeeded(timeout: 5)

        // Wait a moment for the flow to start, then navigate back.
        RunLoop.current.run(until: Date().addingTimeInterval(3))

        // Either we landed authenticated (mock handled it) or a webview opened.
        // Press the device home button to dismiss any external browser sheet.
        if !app.buttons["logoutButton"].exists && !app.buttons["loginButton"].exists {
            // Try dismissing the Safari VC by pressing Cancel if available
            let cancel = app.buttons["Cancel"]
            if cancel.waitForExistence(timeout: 3) {
                cancel.tap()
            }
        }

        // App should still be alive — either authenticated or back on login
        let alive = app.buttons["logoutButton"].waitForExistence(timeout: 5)
            || app.buttons["loginButton"].waitForExistence(timeout: 5)
        XCTAssertTrue(alive, "App should be responsive after social login attempt")
    }
}
