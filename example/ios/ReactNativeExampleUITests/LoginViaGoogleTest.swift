import XCTest

/// Mirrors `LoginViaGoogleTest.kt` — taps "Login with google" which calls
/// `directLoginAction('social-login', 'google')`, then drives the Google
/// hosted UI until the app returns authenticated.
final class LoginViaGoogleTest: UITestCase {
    func test_success_login_via_google_provider() throws {
        launchApp()
        waitFor(app.buttons["loginWithGoogleButton"]).tap()

        // The Google sign-in UI is served via ASWebAuthenticationSession on iOS.
        // Accept the system permission sheet if it's presented.
        acceptSystemContinueIfNeeded()

        let webViews = app.webViews
        let emailField = webViews.textFields.firstMatch
        if emailField.waitForExistence(timeout: 20) {
            emailField.tap()
            emailField.typeText(env("GOOGLE_EMAIL"))
            webViews.buttons["Next"].firstMatch.tap()

            let passwordField = webViews.secureTextFields.firstMatch
            _ = passwordField.waitForExistence(timeout: 20)
            passwordField.tap()
            passwordField.typeText(env("GOOGLE_PASSWORD"))
            webViews.buttons["Next"].firstMatch.tap()
        }

        waitFor(app.buttons["logoutButton"], timeout: 60)
        logoutAndAssert()
    }

    private func acceptSystemContinueIfNeeded() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let continueButton = springboard.buttons["Continue"]
        if continueButton.waitForExistence(timeout: 5) {
            continueButton.tap()
        }
    }
}
