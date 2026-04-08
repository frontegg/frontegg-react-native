import XCTest

/// Mirrors `LogoutTest.kt` from frontegg-android-kotlin.
final class LogoutTest: UITestCase {
    func test_success_logout() throws {
        launchApp()
        loginWithPassword(email: env("LOGIN_EMAIL"), password: env("LOGIN_PASSWORD"))

        app.buttons["logoutButton"].tap()
        waitFor(app.buttons["loginButton"], timeout: 15)

        XCTAssertTrue(
            waitForText("Not Logged in"),
            "Expected 'Not Logged in' text after logout"
        )
    }
}
