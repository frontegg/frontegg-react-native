package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import com.frontegg.demo.e2e.utils.Env
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import com.frontegg.demo.e2e.utils.loginWithPassword
import com.frontegg.demo.e2e.utils.logoutAndAssert
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * New coverage for passkey registration — gap flagged in
 * docs/E2E_REACT_NATIVE_TESTS_REVIEW.md §4. Because passkey enrollment
 * requires a device biometric prompt that cannot be driven by UiAutomator on
 * a plain emulator, this test only verifies the button is reachable and the
 * app stays authenticated. A full enrollment assertion will land once the
 * CI emulator has the Play Services + credential-manager stubs wired up.
 */
@RunWith(AndroidJUnit4::class)
class PasskeysRegisterTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        assumeTrue("LOGIN_EMAIL and LOGIN_PASSWORD required", Env.isAvailable("LOGIN_EMAIL", "LOGIN_PASSWORD"))
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun register_passkeys_button_opens_flow_and_returns() {
        ui.loginWithPassword(Env.loginEmail, Env.loginPassword)

        val button = ui.findByTestId("registerPasskeysButton")
            ?: error("Register Passkeys button not found on authenticated HomeScreen")
        button.click()

        // Either the system credential-manager sheet appears (device back)
        // or the app ignores the call and stays authenticated. Both are
        // acceptable for this smoke — we assert we're still authenticated.
        ui.device.pressBack()
        ui.requireView(By.res("com.frontegg.demo:id/logoutButton"), timeout = 10_000)

        ui.logoutAndAssert()
    }
}
