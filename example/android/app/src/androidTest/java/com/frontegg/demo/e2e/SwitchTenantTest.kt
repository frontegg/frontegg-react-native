package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.frontegg.demo.e2e.utils.Env
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import com.frontegg.demo.e2e.utils.loginWithPassword
import com.frontegg.demo.e2e.utils.logoutAndAssert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/** Mirrors frontegg-android-kotlin's SwitchTenantTest.kt. */
@RunWith(AndroidJUnit4::class)
class SwitchTenantTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun success_tenant_switch() {
        ui.loginWithPassword(Env.loginEmail, Env.loginPassword)

        // Scroll if necessary — the tenants list is rendered below the action buttons.
        ui.device.swipe(500, 1500, 500, 500, 10)

        // Switch to tenant 2
        ui.clickByTextOrFail(Env.tenantName2)
        check(ui.waitForText("(active)")) { "Expected '(active)' marker after switching to ${Env.tenantName2}" }
        check(ui.waitForText("Active Tenant: ${Env.tenantName2}")) {
            "Expected active tenant label to show ${Env.tenantName2}"
        }

        // Switch back to tenant 1
        ui.clickByTextOrFail(Env.tenantName1)
        check(ui.waitForText("Active Tenant: ${Env.tenantName1}")) {
            "Expected active tenant label to show ${Env.tenantName1}"
        }

        ui.logoutAndAssert()
    }
}
