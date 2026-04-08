package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import com.frontegg.demo.e2e.utils.Env
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import com.frontegg.demo.e2e.utils.loginWithPassword
import com.frontegg.demo.e2e.utils.logoutAndAssert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Verifies that after a successful password login, force-stopping and
 * relaunching the app restores the authenticated session from persisted
 * tokens — the user should land on HomeScreen showing their email without
 * re-authenticating.
 *
 * Mirrors the `testPasswordLoginAndSessionRestore` scenario from
 * frontegg-ios-swift/demo-embedded/demo-embedded-e2e/DemoEmbeddedE2ETests.swift.
 */
@RunWith(AndroidJUnit4::class)
class SessionRestoreTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun session_is_restored_after_relaunch() {
        ui.loginWithPassword(Env.loginEmail, Env.loginPassword)

        ui.terminateApp()
        ui.openApp()

        // After relaunch: no Login button, Logout button is visible, email is shown.
        ui.requireView(By.res("com.frontegg.demo:id/logoutButton"), timeout = 30_000)
        check(ui.waitForText(Env.loginEmail)) {
            "Expected email ${Env.loginEmail} to be visible after session restore"
        }

        ui.logoutAndAssert()
    }
}
