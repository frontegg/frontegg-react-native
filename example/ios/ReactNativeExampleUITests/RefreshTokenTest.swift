import XCTest

final class RefreshTokenTest: UITestCase {
    func test_refresh_token_rotates_access_token() throws {
        launchApp()
        try loginWithPassword()

        let tokenLabel = app.staticTexts["accessTokenValue"]
        let before = tokenLabel.label

        app.buttons["refreshTokenButton"].tap()

        let deadline = Date().addingTimeInterval(15)
        var after = before
        while Date() < deadline {
            after = tokenLabel.label
            if after != before { break }
            RunLoop.current.run(until: Date().addingTimeInterval(0.25))
        }

        XCTAssertNotEqual(before, after, "Access token should change after refresh")
        XCTAssertTrue(app.buttons["logoutButton"].exists)
        logoutAndAssert()
    }
}
