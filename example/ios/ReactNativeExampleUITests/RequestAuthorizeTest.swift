import XCTest

/// Exercises the Request Authorization / step-up flow. Matches the scope of
/// the Nightwatch `react-native-sdk-step-up-test.ts`: tap the button and
/// assert the user remains on the authenticated HomeScreen.
final class RequestAuthorizeTest: UITestCase {
    func test_request_authorize_keeps_user_authenticated() throws {
        launchApp()
        loginWithPassword(email: env("LOGIN_EMAIL"), password: env("LOGIN_PASSWORD"))

        app.buttons["requestAuthorizeButton"].tap()

        // Give the async flow a few seconds to settle, then assert we are
        // still on the authenticated HomeScreen.
        RunLoop.current.run(until: Date().addingTimeInterval(3))
        XCTAssertTrue(app.buttons["logoutButton"].exists)

        logoutAndAssert()
    }
}
