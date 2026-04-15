import XCTest

final class LogoutTest: UITestCase {
    func test_success_logout() throws {
        launchApp()
        try loginWithPassword()
        logoutAndAssert()
        XCTAssertTrue(waitForText("Not Logged in"))
    }
}
