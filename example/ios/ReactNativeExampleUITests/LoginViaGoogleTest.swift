import XCTest

/// Social login test. The mock server simulates the Google OAuth redirect
/// flow, so this doesn't require real Google credentials.
final class LoginViaGoogleTest: UITestCase {
    func test_social_login_button_is_reachable() throws {
        launchApp()
        let button = app.buttons["loginWithGoogleButton"]
        waitFor(button, timeout: 10)
        // Tapping opens the social flow via ASWebAuthenticationSession.
        // The mock server handles the redirect. Just verify the button exists
        // and the app survives the tap.
        button.tap()

        addUIInterruptionMonitor(withDescription: "ASWebAuth") { alert in
            alert.buttons["Continue"].exists ? { alert.buttons["Continue"].tap(); return true }() : false
        }
        app.tap()

        // Either we land authenticated (mock handled the flow) or the
        // webview opens. Both are acceptable at smoke level.
        let loggedIn = app.buttons["logoutButton"].waitForExistence(timeout: 15)
        if loggedIn {
            logoutAndAssert()
        } else {
            // Press back/cancel if the webview opened
            app.buttons["Cancel"].tap()
            waitFor(app.buttons["loginButton"], timeout: 10)
        }
    }
}
