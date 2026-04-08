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
 * Exercises the step-up / Request Authorization flow. The example app wires
 * the button to `requestAuthorize(...)` with fixed IDs; we assert the user
 * remains authenticated after the call (matching the Nightwatch step-up test
 * scope).
 */
@RunWith(AndroidJUnit4::class)
class RequestAuthorizeTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun request_authorize_keeps_user_authenticated() {
        ui.loginWithPassword(Env.loginEmail, Env.loginPassword)

        ui.clickByTestId("requestAuthorizeButton")
        delay(3_000)

        // Still on the authenticated home screen.
        ui.requireView(By.res("com.frontegg.demo:id/logoutButton"))

        ui.logoutAndAssert()
    }
}
