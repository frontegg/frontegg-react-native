package com.frontegg.demo.e2e

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.By
import com.frontegg.demo.e2e.utils.Env
import com.frontegg.demo.e2e.utils.UiTestInstrumentation
import com.frontegg.demo.e2e.utils.loginWithPassword
import com.frontegg.demo.e2e.utils.logoutAndAssert
import com.frontegg.demo.e2e.utils.tapLoginButton
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LoginViaEmailAndPasswordTest {
    private lateinit var ui: UiTestInstrumentation

    @Before
    fun setUp() {
        assumeTrue("LOGIN_EMAIL and LOGIN_PASSWORD required", Env.isAvailable("LOGIN_EMAIL", "LOGIN_PASSWORD"))
        ui = UiTestInstrumentation()
        ui.openApp()
    }

    @Test
    fun success_login_via_email_and_password() {
        ui.loginWithPassword(Env.loginEmail, Env.loginPassword)
        check(ui.waitForText(Env.loginEmail)) {
            "Expected logged-in email ${Env.loginEmail} to be rendered on HomeScreen"
        }
        ui.logoutAndAssert()
    }

    @Test
    fun failure_login_via_email_and_wrong_password() {
        assumeTrue("LOGIN_WRONG_PASSWORD required", Env.isAvailable("LOGIN_WRONG_PASSWORD"))
        ui.tapLoginButton()
        ui.inputTextByIndex(0, Env.loginEmail)
        ui.clickByTextOrFail("Continue")
        ui.inputTextByIndex(1, Env.loginWrongPassword)
        ui.clickByTextOrFail("Sign in")

        ui.waitForView(By.textContains("Incorrect email or password"), timeout = 10_000)
            ?: error("Expected 'Incorrect email or password' warning after wrong password")
    }
}
