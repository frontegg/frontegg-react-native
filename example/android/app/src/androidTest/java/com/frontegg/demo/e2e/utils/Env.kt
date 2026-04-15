package com.frontegg.demo.e2e.utils

import androidx.test.platform.app.InstrumentationRegistry

/**
 * Environment variables for E2E tests — read from Gradle instrumentation arguments.
 *
 * Mirrors the pattern from frontegg-android-kotlin:
 *   embedded/src/androidTest/java/com/frontegg/demo/utils/Env.kt
 *
 * Supply values via `-Pandroid.testInstrumentationRunnerArguments.LOGIN_EMAIL=...`
 * or via a file loaded by the Gradle task. See `example/E2E_TESTS.md`.
 */
object Env {
    val loginEmail: String get() = get("LOGIN_EMAIL")
    val loginPassword: String get() = get("LOGIN_PASSWORD")
    val loginWrongPassword: String get() = get("LOGIN_WRONG_PASSWORD")

    val tenantName1: String get() = get("TENANT_NAME_1")
    val tenantName2: String get() = get("TENANT_NAME_2")

    val googleEmail: String get() = get("GOOGLE_EMAIL")
    val googlePassword: String get() = get("GOOGLE_PASSWORD")

    fun isAvailable(vararg names: String): Boolean =
        names.all { InstrumentationRegistry.getArguments().getString(it)?.isNotEmpty() == true }

    private fun get(name: String): String =
        InstrumentationRegistry.getArguments().getString(name) ?: ""
}
