package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import com.frontegg.demo.e2e.utils.Env
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import com.frontegg.demo.e2e.utils.delay
import com.frontegg.demo.e2e.utils.logoutAndAssert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Mirrors frontegg-android-kotlin's LoginViaGoogleTest.kt. The example app
 * exposes a "Login with google" button (testID="loginWithGoogleButton") that
 * calls `directLoginAction('social-login', 'google')`.
 */
@RunWith(AndroidJUnit4::class)
class LoginViaGoogleTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun success_login_via_google_provider() {
        ui.clickByTestId("loginWithGoogleButton")
        loginViaGoogle()
        ui.logoutAndAssert()
    }

    private fun loginViaGoogle() {
        // Accept the Custom Tabs / consent prompts Chrome may show.
        ui.clickByText("Accept & continue", timeout = 5_000)
        ui.clickByText("No thanks", timeout = 5_000)
        delay(3_000)

        if (ui.waitForView(By.text("Sign in"), timeout = 5_000) != null) {
            ui.inputTextByIndex(0, Env.googleEmail)
            ui.clickByTextOrFail("Next")
            delay(3_000)

            ui.inputTextByIndex(0, Env.googlePassword)
            ui.clickByText("Welcome", timeout = 5_000)
            delay(1_000)
            ui.clickByText("Next", timeout = 5_000)
        }

        ui.clickByText(Env.googleEmail, timeout = 10_000)
        ui.clickByText("Open application", timeout = 10_000)

        // Ensure we land authenticated.
        ui.requireView(By.res("com.frontegg.demo:id/logoutButton"), timeout = 30_000)
    }
}
