import XCTest

final class SessionRestoreTest: UITestCase {
    func test_session_is_restored_after_relaunch() throws {
        launchApp(resetState: true)
        loginWithPassword()

        app.terminate()
        launchApp(resetState: false)

        waitFor(app.buttons["logoutButton"], timeout: 30)
        XCTAssertTrue(waitForText("test@frontegg.com"))
        logoutAndAssert()
    }
}
