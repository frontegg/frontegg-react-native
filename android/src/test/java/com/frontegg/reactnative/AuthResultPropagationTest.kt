package com.frontegg.reactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
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
        var resolvedValue: Any? = null
        var resolved = false
        override fun resolve(value: Any?) { resolved = true; resolvedValue = value }
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
    fun login_nullError_resolves() {
        val promise = RecordingPromise()
        resolveOrRejectLogin(null, promise)
        assertEquals(true, promise.resolved)
        assertNull(promise.rejectCode)
    }

    @Test
    fun login_error_rejects_andDoesNotResolve() {
        val promise = RecordingPromise()
        resolveOrRejectLogin(RuntimeException("cancelled"), promise)
        assertFalse("must not resolve on a login failure", promise.resolved)
        assertEquals("LOGIN_ERROR", promise.rejectCode)
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
