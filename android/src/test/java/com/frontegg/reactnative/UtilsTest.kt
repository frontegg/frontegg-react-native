package com.frontegg.reactnative

import org.junit.Assert.assertEquals
import org.junit.Test

class UtilsTest {

    @Test
    fun `single candidate when fallback is null`() {
        val candidates = buildConfigClassCandidates(
            primaryPackageName = "com.example.app",
            fallbackPackageName = null,
        )

        assertEquals(listOf("com.example.app.BuildConfig"), candidates)
    }

    @Test
    fun `single candidate when fallback is blank`() {
        val candidates = buildConfigClassCandidates(
            primaryPackageName = "com.example.app",
            fallbackPackageName = "  ",
        )

        assertEquals(listOf("com.example.app.BuildConfig"), candidates)
    }

    @Test
    fun `applicationId is always tried before fallback`() {
        val candidates = buildConfigClassCandidates(
            primaryPackageName = "com.example.app",
            fallbackPackageName = "com.example.shared",
        )

        assertEquals(
            listOf(
                "com.example.app.BuildConfig",
                "com.example.shared.BuildConfig",
            ),
            candidates,
        )
    }

    @Test
    fun `duplicate candidate is deduplicated when applicationId equals fallback`() {
        val candidates = buildConfigClassCandidates(
            primaryPackageName = "com.example.shared",
            fallbackPackageName = "com.example.shared",
        )

        assertEquals(listOf("com.example.shared.BuildConfig"), candidates)
    }
}
