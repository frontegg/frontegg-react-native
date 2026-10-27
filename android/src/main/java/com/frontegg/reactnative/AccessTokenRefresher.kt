package com.frontegg.reactnative

import android.content.Context
import com.frontegg.android.FronteggAuth
import com.frontegg.android.utils.FronteggConstantsProvider
import com.frontegg.android.utils.JWTHelper
import com.frontegg.android.utils.NetworkGate
import java.io.IOException
import java.time.Instant
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeoutOrNull

private const val MINIMUM_ACCESS_TOKEN_VALIDITY_SECONDS = 15
private const val AUTH_STATE_SETTLE_TIMEOUT_MS = 20_000L
private const val CONCURRENT_REFRESH_TIMEOUT_MS = 10_000L
private const val AUTH_STATE_POLL_INTERVAL_MS = 200L

internal suspend fun fetchValidAccessToken(auth: FronteggAuth, context: Context): String? {
  if (auth.isMultiRegion && auth.selectedRegion == null) {
    return null
  }
  val settled = waitWhile(AUTH_STATE_SETTLE_TIMEOUT_MS) {
    auth.initializing.value || auth.refreshingToken.value
  }
  if (!settled) {
    throw IllegalStateException("Timed out waiting for authentication state to settle")
  }
  if (auth.refreshToken.value == null) {
    return null
  }

  val currentAccessToken = auth.accessToken.value
  if (hasMoreThanMinimumValidity(currentAccessToken)) {
    return currentAccessToken
  }

  val offlineModeEnabled = isOfflineModeEnabled(context)
  if (!NetworkGate.isNetworkLikelyGood(context)) {
    if (offlineModeEnabled) {
      return currentAccessToken
    }
    throw IOException("No network connection to refresh the access token")
  }

  val refreshedAccessToken = refreshUntilValid(auth)
  if (refreshedAccessToken != null) {
    return refreshedAccessToken
  }
  if (auth.refreshToken.value == null) {
    return null
  }
  if (offlineModeEnabled && !NetworkGate.isNetworkLikelyGood(context)) {
    return auth.accessToken.value
  }
  throw IOException("Access token could not be refreshed")
}

private suspend fun refreshUntilValid(auth: FronteggAuth): String? {
  if (!auth.refreshTokenAndWait()) {
    return null
  }
  if (hasMoreThanMinimumValidity(auth.accessToken.value)) {
    return auth.accessToken.value
  }
  waitWhile(CONCURRENT_REFRESH_TIMEOUT_MS) { auth.refreshingToken.value }
  if (hasMoreThanMinimumValidity(auth.accessToken.value)) {
    return auth.accessToken.value
  }
  if (!auth.refreshTokenAndWait()) {
    return null
  }
  return auth.accessToken.value?.takeIf { hasMoreThanMinimumValidity(it) }
}

private suspend fun waitWhile(timeoutMs: Long, condition: () -> Boolean): Boolean {
  val finished = withTimeoutOrNull(timeoutMs) {
    while (condition()) {
      delay(AUTH_STATE_POLL_INTERVAL_MS)
    }
    true
  }
  return finished == true
}

// Same source the SDK is initialized from, both by its auto-init and by RegionsInitializer.
private fun isOfflineModeEnabled(context: Context): Boolean {
  return runCatching {
    FronteggConstantsProvider.fronteggConstants(context).enableOfflineMode
  }.getOrDefault(false)
}

private fun hasMoreThanMinimumValidity(accessToken: String?): Boolean {
  if (accessToken == null) {
    return false
  }
  return try {
    val secondsLeft = JWTHelper.decode(accessToken).exp - Instant.now().epochSecond
    secondsLeft > MINIMUM_ACCESS_TOKEN_VALIDITY_SECONDS
  } catch (e: Exception) {
    false
  }
}
