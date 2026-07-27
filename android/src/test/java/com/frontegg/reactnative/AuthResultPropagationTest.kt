package com.frontegg.reactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.frontegg.android.exceptions.CanceledByUserException
import com.frontegg.android.exceptions.FailedToAuthenticateException
import java.io.IOException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * FR-25938: on Android, `login`'s callback ignored the `Exception?` arg and always resolved `""`,
 * and `switchTenant` ignored the SDK callback's `Boolean` and always resolved the tenant id — so a
 * cancelled login or a failed tenant switch looked like success to JS. The extracted helpers must
 * reject on failure and resolve only on success.
 */
class AuthResultPropagationTest {

    private class RecordingPromise : Promise {
        var rejectCode: String? = null
        var rejectUserInfo: WritableMap? = null
        var resolvedValue: Any? = null
        var resolved = false
        override fun resolve(value: Any?) { resolved = true; resolvedValue = value }
        override fun reject(code: String, message: String?) { rejectCode = code }
        override fun reject(code: String, throwable: Throwable?) { rejectCode = code }
        override fun reject(code: String, message: String?, throwable: Throwable?) { rejectCode = code }
        override fun reject(throwable: Throwable) { rejectCode = "throwable" }
        override fun reject(throwable: Throwable, userInfo: WritableMap) { rejectCode = "throwable" }
        override fun reject(code: String, userInfo: WritableMap) { rejectCode = code; rejectUserInfo = userInfo }
        override fun reject(code: String, throwable: Throwable?, userInfo: WritableMap) { rejectCode = code; rejectUserInfo = userInfo }
        override fun reject(code: String, message: String?, userInfo: WritableMap) { rejectCode = code; rejectUserInfo = userInfo }
        override fun reject(code: String, message: String?, throwable: Throwable?, userInfo: WritableMap) { rejectCode = code; rejectUserInfo = userInfo }
        @Deprecated("Deprecated in Java")
        override fun reject(message: String) { rejectCode = message }
    }

    /** JavaOnlyMap is RN's pure-JVM WritableMap; Arguments.createMap needs native libs. */
    private fun rejectLogin(error: Exception?, promise: Promise) =
        resolveOrRejectLogin(error, promise) { JavaOnlyMap() }

    @Test
    fun login_nullError_resolves() {
        val promise = RecordingPromise()
        rejectLogin(null, promise)
        assertEquals(true, promise.resolved)
        assertNull(promise.rejectCode)
    }

    @Test
    fun login_error_rejects_andDoesNotResolve() {
        val promise = RecordingPromise()
        rejectLogin(RuntimeException("boom"), promise)
        assertFalse("must not resolve on a login failure", promise.resolved)
        assertEquals("unknown", promise.rejectCode)
    }

    // Issue #110: login() rejects with stable, cross-platform codes; the raw platform
    // details ride along in userInfo (nativeCode = exception class name).
    @Test
    fun login_cancelledByUser_rejectsWithUserCancelled() {
        val promise = RecordingPromise()
        rejectLogin(CanceledByUserException(), promise)
        assertEquals("user_cancelled", promise.rejectCode)
        assertEquals(
            "CanceledByUserException",
            (promise.rejectUserInfo as JavaOnlyMap).getString("nativeCode")
        )
    }

    @Test
    fun login_failedToAuthenticate_rejectsWithOauthFailed() {
        val promise = RecordingPromise()
        rejectLogin(FailedToAuthenticateException(error = "bad code"), promise)
        assertEquals("oauth_failed", promise.rejectCode)
    }

    @Test
    fun login_ioException_rejectsWithNetwork() {
        val promise = RecordingPromise()
        rejectLogin(IOException("timeout"), promise)
        assertEquals("network", promise.rejectCode)
    }

    @Test
    fun switchTenant_success_resolvesTenantId() {
        val promise = RecordingPromise()
        resolveTenantSwitch(true, "tenant-42", promise)
        assertEquals("tenant-42", promise.resolvedValue)
        assertNull(promise.rejectCode)
    }

    @Test
    fun switchTenant_failure_rejects_andDoesNotResolve() {
        val promise = RecordingPromise()
        resolveTenantSwitch(false, "tenant-42", promise)
        assertFalse("must not resolve when the tenant switch fails", promise.resolved)
        assertEquals("SWITCH_TENANT_ERROR", promise.rejectCode)
    }
}
