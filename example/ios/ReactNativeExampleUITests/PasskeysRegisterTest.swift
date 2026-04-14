import XCTest

final class PasskeysRegisterTest: UITestCase {
    func test_register_passkeys_button_is_reachable() throws {
        launchApp()
        loginWithPassword()

        let button = app.buttons["registerPasskeysButton"]
        waitFor(button, timeout: 10)
        button.tap()

        // Dismiss system credential-manager sheet if it appears
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.buttons["Cancel"].waitForExistence(timeout: 3) {
            springboard.buttons["Cancel"].tap()
        }

        XCTAssertTrue(app.buttons["logoutButton"].waitForExistence(timeout: 10))
        logoutAndAssert()
    }
}
