import XCTest

/// Mirrors `SwitchTenantTest.kt` from frontegg-android-kotlin.
final class SwitchTenantTest: UITestCase {
    func test_success_tenant_switch() throws {
        launchApp()
        loginWithPassword(email: env("LOGIN_EMAIL"), password: env("LOGIN_PASSWORD"))

        // Scroll down to the tenants list if it's off-screen.
        app.swipeUp()

        let tenant1 = env("TENANT_NAME_1")
        let tenant2 = env("TENANT_NAME_2")

        tapTenantButton(named: tenant2)
        XCTAssertTrue(
            waitForText("Active Tenant: \(tenant2)"),
            "Expected active tenant label to show \(tenant2)"
        )

        tapTenantButton(named: tenant1)
        XCTAssertTrue(
            waitForText("Active Tenant: \(tenant1)"),
            "Expected active tenant label to show \(tenant1)"
        )

        logoutAndAssert()
    }

    private func tapTenantButton(named name: String) {
        // HomeScreen renders tenant buttons with testIDs like
        // `tenantSwitchButton-$tenantId`, but the label contains the name.
        let predicate = NSPredicate(format: "label CONTAINS[c] %@", name)
        let button = app.buttons.matching(predicate).firstMatch
        _ = button.waitForExistence(timeout: 15)
        button.tap()
    }
}
