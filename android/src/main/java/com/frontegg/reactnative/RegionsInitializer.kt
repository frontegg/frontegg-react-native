package com.frontegg.reactnative

import android.content.Context
import android.util.Log
import com.frontegg.android.FronteggApp
import com.frontegg.android.regions.RegionConfig
import com.frontegg.android.utils.FronteggConstantsProvider
import com.frontegg.android.utils.TenantResolver
import com.frontegg.android.utils.TenantResolverResult
import java.util.concurrent.atomic.AtomicBoolean
import org.json.JSONArray
import org.json.JSONException

private val regionsInitialized = AtomicBoolean(false)

internal fun initRegionsFromBuildConfig(context: Context, constants: FronteggConstants) {
  val regionsJson = constants.regionsJson?.takeIf { it.isNotBlank() } ?: return
  if (!regionsInitialized.compareAndSet(false, true)) {
    return
  }
  val regions = try {
    parseRegions(regionsJson)
  } catch (e: JSONException) {
    Log.e(TAG, "FRONTEGG_REGIONS must be a JSON array of {key, baseUrl, clientId, applicationId?}", e)
    return
  }
  val sdkConstants = FronteggConstantsProvider.fronteggConstants(context)
  FronteggApp.initWithRegions(
    regions = regions,
    context = context,
    useAssetsLinks = constants.useAssetsLinks,
    useChromeCustomTabs = constants.useChromeCustomTabs,
    mainActivityClass = findClassOrNull(sdkConstants.mainActivityClass),
    useDiskCacheWebview = sdkConstants.useDiskCacheWebview,
    disableAutoRefresh = sdkConstants.disableAutoRefresh,
    enableOfflineMode = sdkConstants.enableOfflineMode,
    networkMonitoringIntervalSeconds = sdkConstants.networkMonitoringIntervalSeconds,
    enableSessionPerTenant = sdkConstants.enableSessionPerTenant,
    entitlementsEnabled = sdkConstants.entitlementsEnabled,
    tenantResolver = sdkConstants.fronteggOrganization?.let { organization ->
      TenantResolver { TenantResolverResult(organization) }
    },
  )
}

private fun findClassOrNull(className: String?): Class<*>? {
  if (className == null) {
    return null
  }
  return try {
    Class.forName(className)
  } catch (e: ClassNotFoundException) {
    Log.e(TAG, "FRONTEGG_MAIN_ACTIVITY_CLASS ($className) not found", e)
    null
  }
}

internal fun parseRegions(regionsJson: String): List<RegionConfig> {
  val regionsArray = JSONArray(regionsJson)
  return (0 until regionsArray.length()).map { index ->
    val region = regionsArray.getJSONObject(index)
    val applicationId = if (region.isNull("applicationId")) null else region.getString("applicationId")
    RegionConfig(
      region.getString("key"),
      region.getString("baseUrl"),
      region.getString("clientId"),
      applicationId,
    )
  }
}
