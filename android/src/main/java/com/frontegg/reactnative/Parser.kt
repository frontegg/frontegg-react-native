package com.frontegg.reactnative

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.frontegg.android.models.User
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import com.google.gson.Gson

fun User.toReadableMap(): ReadableMap? {
  val jsonStr = Gson().toJson(this, User::class.java)
  val jsonObject = JSONObject(jsonStr)
  return convertJsonToMap(jsonObject)
}

@Throws(JSONException::class)
fun convertJsonToArray(jsonArray: JSONArray): WritableArray? {
  val array = Arguments.createArray()
  for (i in 0 until jsonArray.length()) {
    when (val value = jsonArray[i]) {
      is JSONObject -> {
        array.pushMap(convertJsonToMap(value))
      }

      is JSONArray -> {
        array.pushArray(convertJsonToArray(value))
      }

      is Boolean -> {
        array.pushBoolean(value)
      }

      is Int -> {
        array.pushInt(value)
      }

      is Double -> {
        array.pushDouble(value)
      }

      is String -> {
        array.pushString(value)
      }

      else -> {
        array.pushString(value.toString())
      }
    }
  }
  return array
}

@Throws(JSONException::class)
fun convertJsonToMap(jsonObject: JSONObject): ReadableMap? {
  val map = Arguments.createMap()
  val iterator = jsonObject.keys()
  while (iterator.hasNext()) {
    val key = iterator.next()
    when (val value = jsonObject[key]) {
      is JSONObject -> {
        map.putMap(key, convertJsonToMap(value))
      }

      is JSONArray -> {
        map.putArray(key, convertJsonToArray(value))
      }

      is Boolean -> {
        map.putBoolean(key, value)
      }

      is Int -> {
        map.putInt(key, value)
      }

      is Double -> {
        map.putDouble(key, value)
      }

      is String -> {
        map.putString(key, value)
      }

      else -> {
        map.putString(key, value.toString())
      }
    }
  }
  return map
}
