package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import com.frontegg.demo.e2e.utils.Env
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import com.frontegg.demo.e2e.utils.loginWithPassword
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/** Mirrors frontegg-android-kotlin's LogoutTest.kt. */
@RunWith(AndroidJUnit4::class)
class LogoutTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun success_logout() {
        ui.loginWithPassword(Env.loginEmail, Env.loginPassword)

        ui.clickByTestId("logoutButton")

        // After logout the "Login" button should reappear and the email should
        // be replaced by "Not Logged in".
        ui.requireView(By.res("com.frontegg.demo:id/loginButton"), timeout = 15_000)
        check(ui.waitForText("Not Logged in")) {
            "Expected 'Not Logged in' text after logout"
        }
    }
}
