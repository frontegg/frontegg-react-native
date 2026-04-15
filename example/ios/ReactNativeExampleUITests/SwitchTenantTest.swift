import XCTest

final class SwitchTenantTest: UITestCase {
    func test_success_tenant_switch() throws {
        launchApp()
        try loginWithPassword()
        app.swipeUp()

        XCTAssertTrue(waitForText("Tenants"), "Tenants section should be visible")
        logoutAndAssert()
    }
}
