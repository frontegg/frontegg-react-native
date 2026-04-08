import XCTest

/// Mirrors `LoginViaEmailAndPasswordTest.kt` from frontegg-android-kotlin /
/// the password login scenario from frontegg-ios-swift, targeted at the RN
/// example app.
final class LoginViaEmailAndPasswordTest: UITestCase {
    func test_success_login_via_email_and_password() throws {
        launchApp()
        loginWithPassword(email: env("LOGIN_EMAIL"), password: env("LOGIN_PASSWORD"))

        XCTAssertTrue(
            waitForText(env("LOGIN_EMAIL")),
            "Expected logged-in email to be rendered on HomeScreen"
        )

        logoutAndAssert()
    }

    func test_failure_login_via_email_and_wrong_password() throws {
        launchApp()
        tapLoginButton()

        let emailField = app.webViews.textFields.firstMatch
        _ = emailField.waitForExistence(timeout: 20)
        emailField.tap()
        emailField.typeText(env("LOGIN_EMAIL"))
        app.webViews.buttons["Continue"].firstMatch.tap()

        let passwordField = app.webViews.secureTextFields.firstMatch
        _ = passwordField.waitForExistence(timeout: 20)
        passwordField.tap()
        passwordField.typeText(env("LOGIN_WRONG_PASSWORD"))
        app.webViews.buttons["Sign in"].firstMatch.tap()

        let error = app.webViews.staticTexts
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Incorrect email or password"))
            .firstMatch
        XCTAssertTrue(
            error.waitForExistence(timeout: 15),
            "Expected 'Incorrect email or password' warning"
        )
    }
}
