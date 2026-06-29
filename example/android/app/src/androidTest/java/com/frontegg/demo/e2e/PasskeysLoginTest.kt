package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import com.frontegg.demo.e2e.utils.delay
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
        // Verify the button exists and is clickable. The click may open a
        // credential-manager sheet that can't be dismissed cleanly on all
        // emulators — the assertion is that the button is reachable and
        // the tap doesn't crash the app process.
        ui.clickByTextOrFail("Login with Passkeys")
        // If we got here without an exception, the button was found and tapped.
    }
}
