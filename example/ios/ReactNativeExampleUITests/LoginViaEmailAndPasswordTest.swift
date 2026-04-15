import XCTest

final class LoginViaEmailAndPasswordTest: UITestCase {
    func test_success_login_via_email_and_password() throws {
        launchApp()
        try loginWithPassword()
        XCTAssertTrue(waitForText(ProcessInfo.processInfo.environment["LOGIN_EMAIL"] ?? "test@frontegg.com"))
        logoutAndAssert()
    }

    func test_failure_login_via_wrong_password() throws {
        let wrongPassword = ProcessInfo.processInfo.environment["LOGIN_WRONG_PASSWORD"]
        guard let wrongPw = wrongPassword, !wrongPw.isEmpty else {
            throw XCTSkip("LOGIN_WRONG_PASSWORD env var required")
        }

        launchApp()
        waitFor(app.buttons["loginButton"]).tap()
        acceptSystemDialogIfNeeded()

        let webView = app.webViews.firstMatch
        guard webView.waitForExistence(timeout: 30) else {
            throw XCTSkip("WebView did not appear — ASWebAuthenticationSession may not be accessible on this OS version")
        }

        let emailField = webView.textFields.firstMatch
        guard emailField.waitForExistence(timeout: 15) else {
            XCTFail("Email field not found")
            return
        }
        emailField.tap()
        emailField.typeText(ProcessInfo.processInfo.environment["LOGIN_EMAIL"] ?? "test@frontegg.com")
        webView.buttons["Continue"].tap()

        let pw = webView.secureTextFields.firstMatch
        guard pw.waitForExistence(timeout: 15) else {
            XCTFail("Password field not found")
            return
        }
        pw.tap()
        pw.typeText(wrongPw)
        webView.buttons["Sign in"].tap()

        let error = webView.staticTexts
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Incorrect"))
            .firstMatch
        XCTAssertTrue(error.waitForExistence(timeout: 15))
    }
}
