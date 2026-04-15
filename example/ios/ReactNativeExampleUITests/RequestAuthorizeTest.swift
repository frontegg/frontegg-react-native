import XCTest

final class RequestAuthorizeTest: UITestCase {
    func test_request_authorize_keeps_user_authenticated() throws {
        launchApp()
        try loginWithPassword()

        app.buttons["requestAuthorizeButton"].tap()
        RunLoop.current.run(until: Date().addingTimeInterval(3))

        XCTAssertTrue(app.buttons["logoutButton"].exists)
        logoutAndAssert()
    }
}
