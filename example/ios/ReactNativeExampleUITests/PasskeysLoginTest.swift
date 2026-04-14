import XCTest

final class PasskeysLoginTest: UITestCase {
    func test_login_with_passkeys_button_is_reachable() throws {
        launchApp()

        let button = app.buttons["loginWithPasskeysButton"]
        waitFor(button, timeout: 10)
        button.tap()

        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.buttons["Cancel"].waitForExistence(timeout: 3) {
            springboard.buttons["Cancel"].tap()
        }

        XCTAssertTrue(app.buttons["loginButton"].waitForExistence(timeout: 10))
    }
}
