import XCTest

/// Base class for React Native example app UI tests.
///
/// Mirrors the `MockServerTestCase` from frontegg-ionic-capacitor and
/// `DemoEmbeddedUITestCase` from frontegg-ios-swift.  Starts a
/// `LocalMockAuthServer` once per test class.  Each test launches the
/// app with `frontegg-testing=true` so FronteggSwift reads
/// `FronteggTest.plist` (baseUrl → mock server at 127.0.0.1:49381).
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
        app.launchEnvironment = Self.server.launchEnvironment(resetState: resetState)
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

    // MARK: - Login flow (via mock hosted login webview)

    /// Taps the Login button and drives the mock hosted login form.
    /// Email defaults to "test@frontegg.com", password to "Testpassword1!".
    func loginWithPassword(
        email: String = "test@frontegg.com",
        password: String = "Testpassword1!"
    ) {
        // Tap the RN app's Login button
        waitFor(app.buttons["loginButton"]).tap()

        // Handle ASWebAuthenticationSession consent alert
        addUIInterruptionMonitor(withDescription: "ASWebAuth consent") { alert in
            let continueButton = alert.buttons["Continue"]
            if continueButton.exists {
                continueButton.tap()
                return true
            }
            return false
        }
        app.tap() // nudge the interruption monitor

        // Drive the mock hosted login WebView
        let webView = app.webViews.firstMatch
        _ = webView.waitForExistence(timeout: 20)

        let emailField = webView.textFields.firstMatch
        _ = emailField.waitForExistence(timeout: 10)
        emailField.tap()
        emailField.typeText(email)

        let continueBtn = webView.buttons["Continue"]
        _ = continueBtn.waitForExistence(timeout: 5)
        continueBtn.tap()

        let passwordField = webView.secureTextFields.firstMatch
        _ = passwordField.waitForExistence(timeout: 10)
        passwordField.tap()
        passwordField.typeText(password)

        webView.buttons["Sign in"].tap()

        // Wait until we're back on the native screen, authenticated.
        waitFor(app.buttons["logoutButton"], timeout: 30)
    }

    func logoutAndAssert() {
        app.buttons["logoutButton"].tap()
        waitFor(app.buttons["loginButton"], timeout: 15)
    }
}
