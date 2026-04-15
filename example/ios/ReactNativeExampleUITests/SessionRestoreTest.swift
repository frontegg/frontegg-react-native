import XCTest

final class SessionRestoreTest: UITestCase {
    func test_session_is_restored_after_relaunch() throws {
        launchApp(resetState: true)
        try loginWithPassword()

        app.terminate()
        launchApp(resetState: false)

        waitFor(app.buttons["logoutButton"], timeout: 30)
        XCTAssertTrue(waitForText(ProcessInfo.processInfo.environment["LOGIN_EMAIL"] ?? "test@frontegg.com"))
        logoutAndAssert()
    }
}
