package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import com.frontegg.demo.e2e.utils.Env
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import com.frontegg.demo.e2e.utils.delay
import com.frontegg.demo.e2e.utils.loginWithPassword
import com.frontegg.demo.e2e.utils.logoutAndAssert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * New coverage — the Refresh Token button was flagged as untested in
 * docs/E2E_REACT_NATIVE_TESTS_REVIEW.md §5.4. Verifies that tapping
 * "Refresh Token" produces a new access-token suffix without signing the user
 * out.
 */
@RunWith(AndroidJUnit4::class)
class RefreshTokenTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun refresh_token_button_rotates_access_token() {
        ui.loginWithPassword(Env.loginEmail, Env.loginPassword)

        val before = ui.requireView(By.res("com.frontegg.demo:id/accessTokenValue")).text

        ui.clickByTestId("refreshTokenButton")
        delay(5_000)

        val after = ui.requireView(By.res("com.frontegg.demo:id/accessTokenValue")).text
        check(before != after) {
            "Expected access token to change after tapping Refresh Token. before='$before' after='$after'"
        }
        // Still authenticated.
        ui.requireView(By.res("com.frontegg.demo:id/logoutButton"))

        ui.logoutAndAssert()
    }
}
