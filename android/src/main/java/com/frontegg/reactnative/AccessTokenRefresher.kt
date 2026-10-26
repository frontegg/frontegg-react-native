package com.frontegg.reactnative

import com.frontegg.android.FronteggAuth
import com.frontegg.android.utils.JWTHelper
import java.io.IOException
import java.time.Instant
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeoutOrNull

private const val MINIMUM_ACCESS_TOKEN_VALIDITY_SECONDS = 15
private const val AUTH_STATE_SETTLE_TIMEOUT_MS = 20_000L
private const val AUTH_STATE_SETTLE_POLL_INTERVAL_MS = 200L

// Mirrors iOS getOrRefreshAccessTokenAsync() using only the pinned Android SDK's public API.
internal suspend fun fetchValidAccessToken(auth: FronteggAuth): String? {
  val settled = withTimeoutOrNull(AUTH_STATE_SETTLE_TIMEOUT_MS) {
    while (isAuthStateSettling(auth)) {
      delay(AUTH_STATE_SETTLE_POLL_INTERVAL_MS)
    }
  }
  if (settled == null) {
    throw IllegalStateException("Timed out waiting for authentication state to settle")
  }

  if (auth.refreshToken.value == null) {
    return null
  }

  val currentAccessToken = auth.accessToken.value
  if (currentAccessToken != null && hasMoreThanMinimumValidity(currentAccessToken)) {
    return currentAccessToken
  }

  if (auth.refreshTokenAndWait()) {
    return auth.accessToken.value
  }
  if (auth.refreshToken.value == null) {
    return null
  }
  if (auth.isOfflineMode.value) {
    return auth.accessToken.value
  }
  throw IOException("Access token could not be refreshed")
}

private fun isAuthStateSettling(auth: FronteggAuth): Boolean {
  val loadingOnline = auth.isLoading.value && !auth.isOfflineMode.value
  return auth.initializing.value || auth.refreshingToken.value || loadingOnline
}

private fun hasMoreThanMinimumValidity(accessToken: String): Boolean {
  return try {
    val secondsLeft = JWTHelper.decode(accessToken).exp - Instant.now().epochSecond
    secondsLeft > MINIMUM_ACCESS_TOKEN_VALIDITY_SECONDS
  } catch (e: Exception) {
    false
  }
}
