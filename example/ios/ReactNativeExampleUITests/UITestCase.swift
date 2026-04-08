import XCTest

/// Base class for the React Native example app UI tests.
///
/// Mirrors the pattern from `frontegg-ios-swift`'s
/// `DemoEmbeddedUITestCase.swift`, scaled down for the RN example app which
/// drives the hosted Frontegg login flow with real credentials supplied via
/// `launchEnvironment`. See `example/E2E_TESTS.md` for how to run.
class UITestCase: XCTestCase {
    var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    override func tearDownWithError() throws {
        app?.terminate()
    }

    // MARK: - Launch

    @discardableResult
    func launchApp() -> XCUIApplication {
        let app = XCUIApplication()
        // Forward the credentials injected by `xcodebuild ... -testPlan` or the
        // exporting shell into the app — they are only used inside this test
        // target, never read by the shipping app.
        for key in [
            "LOGIN_EMAIL", "LOGIN_PASSWORD", "LOGIN_WRONG_PASSWORD",
            "TENANT_NAME_1", "TENANT_NAME_2",
            "GOOGLE_EMAIL", "GOOGLE_PASSWORD",
        ] {
            if let value = ProcessInfo.processInfo.environment[key] {
                app.launchEnvironment[key] = value
            }
        }
        app.launch()
        self.app = app
        return app
    }

    // MARK: - Env

    func env(_ key: String, file: StaticString = #filePath, line: UInt = #line) -> String {
        guard let value = ProcessInfo.processInfo.environment[key], !value.isEmpty else {
            XCTFail("Missing required environment variable: \(key)", file: file, line: line)
            return ""
        }
        return value
    }

    // MARK: - Waits

    @discardableResult
    func waitFor(_ element: XCUIElement, timeout: TimeInterval = 20,
                 file: StaticString = #filePath, line: UInt = #line) -> XCUIElement {
        XCTAssertTrue(
            element.waitForExistence(timeout: timeout),
            "Element did not appear: \(element)",
            file: file, line: line
        )
        return element
    }

    func waitForText(_ text: String, timeout: TimeInterval = 20) -> Bool {
        let predicate = NSPredicate(format: "label CONTAINS[c] %@", text)
        let element = app.descendants(matching: .any).matching(predicate).firstMatch
        return element.waitForExistence(timeout: timeout)
    }

    // MARK: - High-level flows

    func tapLoginButton() {
        waitFor(app.buttons["loginButton"]).tap()
    }

    func loginWithPassword(email: String, password: String) {
        tapLoginButton()

        // The hosted login form is inside a WKWebView. Use web descendants.
        let emailField = app.webViews.textFields.firstMatch
        _ = emailField.waitForExistence(timeout: 20)
        emailField.tap()
        emailField.typeText(email)

        app.webViews.buttons["Continue"].firstMatch.tap()

        let passwordField = app.webViews.secureTextFields.firstMatch
        _ = passwordField.waitForExistence(timeout: 20)
        passwordField.tap()
        passwordField.typeText(password)

        app.webViews.buttons["Sign in"].firstMatch.tap()

        // Back on the native HomeScreen — logout button present.
        waitFor(app.buttons["logoutButton"], timeout: 30)
    }

    func logoutAndAssert() {
        app.buttons["logoutButton"].tap()
        waitFor(app.buttons["loginButton"], timeout: 15)
    }
}
