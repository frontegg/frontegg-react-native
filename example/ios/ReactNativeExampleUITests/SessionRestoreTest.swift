import XCTest

/// Mirrors the `testPasswordLoginAndSessionRestore` scenario from
/// frontegg-ios-swift's DemoEmbeddedE2ETests.swift.
final class SessionRestoreTest: UITestCase {
    func test_session_is_restored_after_relaunch() throws {
        launchApp()
        loginWithPassword(email: env("LOGIN_EMAIL"), password: env("LOGIN_PASSWORD"))

        app.terminate()
        launchApp()

        waitFor(app.buttons["logoutButton"], timeout: 30)
        XCTAssertTrue(
            waitForText(env("LOGIN_EMAIL")),
            "Expected email to be visible after session restore"
        )

        logoutAndAssert()
    }
}
