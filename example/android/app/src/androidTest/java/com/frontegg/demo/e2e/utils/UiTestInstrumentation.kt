package com.frontegg.demo.e2e.utils

import android.app.Instrumentation
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.widget.EditText
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.BySelector
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiObject2
import androidx.test.uiautomator.Until

/**
 * UiAutomator-based driver for the React Native example app.
 *
 * Ported from frontegg-android-kotlin's `UiTestInstrumentation.kt`. React Native
 * maps each `testID` prop to the Android view's `resource-id` (prefixed with the
 * app package), so we expose a `clickByTestId` helper alongside the text-based
 * helpers used by the reference Kotlin SDK tests.
 */
class UiTestInstrumentation(
    private val defaultTimeoutMs: Long = 15_000L,
) {
    private val instrumentation: Instrumentation =
        InstrumentationRegistry.getInstrumentation()
    private val uiDevice: UiDevice = UiDevice.getInstance(instrumentation)
    private val targetContext: Context = instrumentation.targetContext

    val device: UiDevice get() = uiDevice

    fun openApp(
        activityName: String = "com.frontegg.demo.MainActivity",
        applicationPackage: String = "com.frontegg.demo",
    ) {
        val intent = Intent(Intent.ACTION_MAIN).apply {
            setClassName(targetContext, activityName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        targetContext.startActivity(intent)
        uiDevice.wait(Until.hasObject(By.pkg(applicationPackage).depth(0)), 5_000)
    }

    fun terminateApp(applicationPackage: String = "com.frontegg.demo") {
        uiDevice.executeShellCommand("am force-stop $applicationPackage")
        delay(500)
    }

    fun waitForView(
        selector: BySelector,
        timeout: Long = defaultTimeoutMs,
    ): UiObject2? {
        val deadline = SystemClock.uptimeMillis() + timeout
        while (SystemClock.uptimeMillis() < deadline) {
            uiDevice.findObject(selector)?.let { return it }
            delay(250)
        }
        return null
    }

    fun requireView(selector: BySelector, timeout: Long = defaultTimeoutMs): UiObject2 =
        waitForView(selector, timeout)
            ?: error("Timed out waiting for $selector after ${timeout}ms. ${dumpVisible()}")

    fun clickByText(text: String, timeout: Long = defaultTimeoutMs): Boolean {
        val view = waitForView(By.text(text), timeout) ?: return false
        view.click()
        return true
    }

    fun clickByTextOrFail(text: String, timeout: Long = defaultTimeoutMs) {
        if (!clickByText(text, timeout)) {
            error("Could not find clickable text '$text' within ${timeout}ms. ${dumpVisible()}")
        }
    }

    /**
     * Click a React Native element by its `testID` prop. RN renders the testID
     * as the native view's `resource-id` in the form `$package:id/$testId` on
     * older RN versions, or simply as the content description on newer ones —
     * we try both.
     */
    fun clickByTestId(testId: String, timeout: Long = defaultTimeoutMs) {
        val byResId = By.res("com.frontegg.demo:id/$testId")
        val byDesc = By.desc(testId)
        val view = waitForView(byResId, timeout / 2) ?: waitForView(byDesc, timeout / 2)
        view?.click() ?: error(
            "Could not find testID '$testId' as resource-id or content-desc. ${dumpVisible()}"
        )
    }

    fun findByTestId(testId: String, timeout: Long = defaultTimeoutMs): UiObject2? {
        val byResId = By.res("com.frontegg.demo:id/$testId")
        val byDesc = By.desc(testId)
        return waitForView(byResId, timeout / 2) ?: waitForView(byDesc, timeout / 2)
    }

    fun inputTextByIndex(index: Int, text: String): Boolean {
        val deadline = SystemClock.uptimeMillis() + defaultTimeoutMs
        while (SystemClock.uptimeMillis() < deadline) {
            val fields = uiDevice.findObjects(By.clazz(EditText::class.java))
            if (fields.size > index) {
                fields[index].text = text
                return true
            }
            delay(250)
        }
        return false
    }

    fun waitForText(text: String, timeout: Long = defaultTimeoutMs): Boolean =
        waitForView(By.textContains(text), timeout) != null

    private fun dumpVisible(): String {
        val objects = uiDevice.findObjects(By.enabled(true))
        return "Visible objects: " + objects.joinToString(", ") {
            "${it.resourceName ?: "?"}=${it.text ?: it.contentDescription ?: ""}"
        }
    }
}

fun delay(ms: Long = 1_000L) = SystemClock.sleep(ms)

/**
 * High-level helpers matching the reference repo's `Utils.kt` style.
 */
fun UiTestInstrumentation.tapLoginButton() {
    clickByTestId("loginButton")
    // The RN SDK opens a Chrome Custom Tab / WebView with the hosted login form.
    // The first field is email. Wait for it to settle before returning.
    requireView(By.clazz(EditText::class.java), timeout = 20_000)
}

fun UiTestInstrumentation.loginWithPassword(email: String, password: String) {
    tapLoginButton()
    inputTextByIndex(0, email)
    clickByTextOrFail("Continue")
    inputTextByIndex(1, password)
    clickByTextOrFail("Sign in")
    // Wait until we're back on the app and authenticated.
    requireView(By.res("com.frontegg.demo:id/logoutButton"), timeout = 30_000)
}

fun UiTestInstrumentation.logoutAndAssert() {
    clickByTestId("logoutButton")
    requireView(By.res("com.frontegg.demo:id/loginButton"), timeout = 15_000)
}
