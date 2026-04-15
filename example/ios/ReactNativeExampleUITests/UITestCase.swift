import XCTest

/// Base class for React Native example app UI tests.
///
/// Starts a `LocalMockAuthServer` once per test class. The app is launched
/// with `frontegg-testing=true` so FronteggSwift reads `FronteggTest.plist`,
/// and `FRONTEGG_E2E_BASE_URL` / `FRONTEGG_E2E_CLIENT_ID` redirect the SDK
/// to the mock server at localhost:49381.
///
/// Login-dependent tests drive the hosted login form via
/// ASWebAuthenticationSession. When `LOGIN_EMAIL` and `LOGIN_PASSWORD` env
/// vars are set (CI / local `.env`), real Frontegg is used for the login
/// WebView while the SDK itself talks to the mock server. When the vars are
/// absent, login tests are skipped with `XCTSkip`.
class UITestCase: XCTestCase {
    static var server: LocalMockAuthServer!
    var app: XCUIApplication!

    // MARK: - Class lifecycle (mock server)

    override class func setUp() {
        super.setUp()
        if server == nil {
            server = try! LocalMockAuthServer()
        }
    }

    override class func tearDown() {
        server?.stop()
        server = nil
        super.tearDown()
    }

    // MARK: - Per-test lifecycle

    override func setUpWithError() throws {
        continueAfterFailure = false
        try Self.server.reset()
    }

    override func tearDownWithError() throws {
        app?.terminate()
    }

    // MARK: - Launch

    @discardableResult
    func launchApp(resetState: Bool = true) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment = Self.server.launchEnvironment(
            resetState: resetState,
            useTestingWebAuthenticationTransport: false
        )
        app.launch()
        self.app = app
        return app
    }

    // MARK: - Waits

    @discardableResult
    func waitFor(
        _ element: XCUIElement,
        timeout: TimeInterval = 20,
        file: StaticString = #filePath,
        line: UInt = #line
    ) -> XCUIElement {
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

    // MARK: - Login flow (via ASWebAuthenticationSession)

    /// Taps the Login button, dismisses the ASWebAuth consent alert,
    /// and fills the hosted login form with the provided credentials.
    ///
    /// Requires `LOGIN_EMAIL` and `LOGIN_PASSWORD` environment variables.
    /// Throws `XCTSkip` if credentials are not available.
    func loginWithPassword(
        email: String? = nil,
        password: String? = nil
    ) throws {
        let resolvedEmail = email ?? ProcessInfo.processInfo.environment["LOGIN_EMAIL"]
        let resolvedPassword = password ?? ProcessInfo.processInfo.environment["LOGIN_PASSWORD"]

        guard let loginEmail = resolvedEmail, !loginEmail.isEmpty,
              let loginPassword = resolvedPassword, !loginPassword.isEmpty else {
            throw XCTSkip("LOGIN_EMAIL and LOGIN_PASSWORD env vars required for login tests")
        }

        // Tap the RN app's Login button
        waitFor(app.buttons["loginButton"]).tap()

        // Handle ASWebAuthenticationSession consent alert
        acceptSystemDialogIfNeeded()

        // The hosted login opens in ASWebAuthenticationSession. On iOS 17+
        // the webview content IS accessible via app.webViews.
        let webView = app.webViews.firstMatch
        guard webView.waitForExistence(timeout: 30) else {
            XCTFail("Hosted login web view did not appear")
            return
        }

        let emailField = webView.textFields.firstMatch
        guard emailField.waitForExistence(timeout: 15) else {
            XCTFail("Email field not found in hosted login")
            return
        }
        emailField.tap()
        emailField.typeText(loginEmail)

        let continueBtn = webView.buttons["Continue"]
        guard continueBtn.waitForExistence(timeout: 5) else {
            XCTFail("Continue button not found")
            return
        }
        continueBtn.tap()

        let passwordField = webView.secureTextFields.firstMatch
        guard passwordField.waitForExistence(timeout: 15) else {
            XCTFail("Password field not found in hosted login")
            return
        }
        passwordField.tap()
        passwordField.typeText(loginPassword)

        webView.buttons["Sign in"].tap()

        // Wait until we're back on the native screen, authenticated.
        waitFor(app.buttons["logoutButton"], timeout: 30)
    }

    func logoutAndAssert() {
        app.buttons["logoutButton"].tap()
        waitFor(app.buttons["loginButton"], timeout: 15)
    }

    func acceptSystemDialogIfNeeded(timeout: TimeInterval = 5) {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let deadline = Date().addingTimeInterval(timeout)
        let buttonTitles = ["Continue", "Open", "Allow", "OK"]
        while Date() < deadline {
            for title in buttonTitles {
                let button = springboard.buttons[title]
                if button.exists {
                    button.tap()
                    return
                }
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.2))
        }
    }
}
