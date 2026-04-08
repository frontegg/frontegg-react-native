import XCTest

/// New coverage — the Refresh Token button was flagged as untested in
/// docs/E2E_REACT_NATIVE_TESTS_REVIEW.md §5.4.
final class RefreshTokenTest: UITestCase {
    func test_refresh_token_rotates_access_token() throws {
        launchApp()
        loginWithPassword(email: env("LOGIN_EMAIL"), password: env("LOGIN_PASSWORD"))

        let before = app.staticTexts["accessTokenValue"].label
        app.buttons["refreshTokenButton"].tap()

        let deadline = Date().addingTimeInterval(15)
        var after = before
        while Date() < deadline {
            after = app.staticTexts["accessTokenValue"].label
            if after != before { break }
            RunLoop.current.run(until: Date().addingTimeInterval(0.25))
        }

        XCTAssertNotEqual(
            before, after,
            "Expected access token to change after tapping Refresh Token"
        )
        XCTAssertTrue(app.buttons["logoutButton"].exists)

        logoutAndAssert()
    }
}
