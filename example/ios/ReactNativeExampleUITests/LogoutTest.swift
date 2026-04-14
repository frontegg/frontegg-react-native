import XCTest

final class LogoutTest: UITestCase {
    func test_success_logout() throws {
        launchApp()
        loginWithPassword()
        logoutAndAssert()
        XCTAssertTrue(waitForText("Not Logged in"))
    }
}
