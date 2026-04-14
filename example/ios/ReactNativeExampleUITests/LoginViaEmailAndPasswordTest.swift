import XCTest

final class LoginViaEmailAndPasswordTest: UITestCase {
    func test_success_login_via_email_and_password() throws {
        launchApp()
        loginWithPassword()
        XCTAssertTrue(waitForText("test@frontegg.com"))
        logoutAndAssert()
    }

    func test_failure_login_via_wrong_password() throws {
        launchApp()
        waitFor(app.buttons["loginButton"]).tap()

        addUIInterruptionMonitor(withDescription: "ASWebAuth") { alert in
            alert.buttons["Continue"].exists ? { alert.buttons["Continue"].tap(); return true }() : false
        }
        app.tap()

        let webView = app.webViews.firstMatch
        _ = webView.waitForExistence(timeout: 20)
        webView.textFields.firstMatch.tap()
        webView.textFields.firstMatch.typeText("test@frontegg.com")
        webView.buttons["Continue"].tap()

        let pw = webView.secureTextFields.firstMatch
        _ = pw.waitForExistence(timeout: 10)
        pw.tap()
        pw.typeText("WrongPassword123!")
        webView.buttons["Sign in"].tap()

        // The mock server returns the login page again with an error for wrong password
        let error = webView.staticTexts
            .containing(NSPredicate(format: "label CONTAINS[c] %@", "Incorrect"))
            .firstMatch
        XCTAssertTrue(error.waitForExistence(timeout: 15))
    }
}
