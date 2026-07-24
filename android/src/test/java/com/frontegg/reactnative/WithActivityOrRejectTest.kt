package com.frontegg.reactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

/**
 * FR-25939: login/directLoginAction/loginWithPasskeys/registerPasskeys used `currentActivity!!`,
 * which throws KotlinNullPointerException (crashing the app) when the activity is null — e.g. the
 * app is backgrounded or the activity was recreated. `withActivityOrReject` must instead reject the
 * promise with NO_ACTIVITY and skip the block (matching stepUp/openAdminPortal, which already do so).
 */
class WithActivityOrRejectTest {

    /** Records only the calls we assert on; the rest satisfy the Promise interface. */
    private class RecordingPromise : Promise {
        var rejectCode: String? = null
        var resolved = false
        override fun resolve(value: Any?) { resolved = true }
        override fun reject(code: String, message: String?) { rejectCode = code }
        override fun reject(code: String, throwable: Throwable?) { rejectCode = code }
        override fun reject(code: String, message: String?, throwable: Throwable?) { rejectCode = code }
        override fun reject(throwable: Throwable) { rejectCode = "throwable" }
        override fun reject(throwable: Throwable, userInfo: WritableMap) { rejectCode = "throwable" }
        override fun reject(code: String, userInfo: WritableMap) { rejectCode = code }
        override fun reject(code: String, throwable: Throwable?, userInfo: WritableMap) { rejectCode = code }
        override fun reject(code: String, message: String?, userInfo: WritableMap) { rejectCode = code }
        override fun reject(code: String, message: String?, throwable: Throwable?, userInfo: WritableMap) { rejectCode = code }
        @Deprecated("Deprecated in Java")
        override fun reject(message: String) { rejectCode = message }
    }

    @Test
    fun nullActivity_rejectsWithNoActivity_andSkipsBlock() {
        val promise = RecordingPromise()
        var blockRan = false

        withActivityOrReject(null, promise) { blockRan = true }

        assertFalse("the block must not run when no activity is attached", blockRan)
        assertFalse("the promise must not be resolved when no activity is attached", promise.resolved)
        assertEquals(
            "must reject with NO_ACTIVITY rather than throw a KotlinNullPointerException",
            "NO_ACTIVITY",
            promise.rejectCode,
        )
    }
}
