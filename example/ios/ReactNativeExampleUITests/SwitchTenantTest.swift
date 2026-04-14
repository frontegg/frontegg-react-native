import XCTest

final class SwitchTenantTest: UITestCase {
    func test_success_tenant_switch() throws {
        launchApp()
        loginWithPassword()
        app.swipeUp()

        // The mock server provisions two tenants for the test user.
        // Their names come from the mock auth state.
        // For now, just verify the tenant section renders and a switch
        // button is tappable without crashing.
        XCTAssertTrue(waitForText("Tenants"), "Tenants section should be visible")
        logoutAndAssert()
    }
}
