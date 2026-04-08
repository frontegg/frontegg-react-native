package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * New coverage for passkey login — gap flagged in
 * docs/E2E_REACT_NATIVE_TESTS_REVIEW.md §4. Verifies the button is reachable
 * on the unauthenticated HomeScreen and does not crash the app. Full
 * verification of the credential-manager sheet requires a passkey-provisioned
 * emulator and is tracked separately.
 */
@RunWith(AndroidJUnit4::class)
class PasskeysLoginTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun login_with_passkeys_button_is_reachable() {
        val button = ui.findByTestId("loginWithPasskeysButton")
            ?: error("Login with Passkeys button not found on unauthenticated HomeScreen")
        button.click()

        // Dismiss any credential-manager sheet that appeared.
        ui.device.pressBack()

        // App is still alive and back on the login screen.
        ui.requireView(By.res("com.frontegg.demo:id/loginButton"), timeout = 10_000)
    }
}
