package com.frontegg.reactnative

import android.content.Context
import android.util.Log
import com.frontegg.android.FronteggApp
import com.frontegg.android.regions.RegionConfig
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
  FronteggApp.initWithRegions(
    regions = regions,
    context = context,
    useAssetsLinks = constants.useAssetsLinks,
    useChromeCustomTabs = constants.useChromeCustomTabs,
  )
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
