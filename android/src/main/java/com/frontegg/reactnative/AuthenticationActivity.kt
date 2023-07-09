package com.frontegg.reactnative

import com.frontegg.reactnative.FronteggRNModule.Companion.FRONTEGG_OAUTH_LOGIN_REQUEST
import com.frontegg.reactnative.FronteggRNModule.Companion.NO_BROWSER_FOUND_RESULT_CODE
import com.frontegg.reactnative.FronteggRNModule.Companion.UNKNOWN_ERROR_RESULT_CODE
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.browser.customtabs.CustomTabsIntent
import com.frontegg.android.utils.AuthorizeUrlGenerator

class AuthenticationActivity : Activity() {
  private var intentLaunched = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (savedInstanceState != null) {
      intentLaunched = savedInstanceState.getBoolean(EXTRA_INTENT_LAUNCHED, false)
    }
  }

  override fun onResume() {
    super.onResume()
    val authenticationIntent: Intent = getIntent()
    if (!intentLaunched && authenticationIntent.getExtras() == null) {
      finish() // Activity was launched in an unexpected way
      return
    } else if (!intentLaunched) {
      intentLaunched = true
      launchAuthenticationIntent()
      return
    }
    val resultMissing = authenticationIntent.getData() == null
    if (resultMissing) setResult(RESULT_CANCELED) else setResult(RESULT_OK, authenticationIntent)
    finish()
  }

  override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    outState.putBoolean(EXTRA_INTENT_LAUNCHED, intentLaunched)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
  }

  private fun launchAuthenticationIntent() {
    try {
      val extras: Bundle = getIntent().getExtras()!!
      val authorizeUri: Uri = extras.getParcelable(EXTRA_AUTHORIZE_URI)!!
      val builder = CustomTabsIntent.Builder()
      val customTabsIntent: CustomTabsIntent = builder.build()
      customTabsIntent.launchUrl(this, authorizeUri)
    } catch (e: Exception) {
      if (e is ActivityNotFoundException) {
        setResult(NO_BROWSER_FOUND_RESULT_CODE)
      } else {
        setResult(UNKNOWN_ERROR_RESULT_CODE)
      }
      finish()
    }
  }

  companion object {
    const val EXTRA_AUTHORIZE_URI = "com.auth0.android.EXTRA_AUTHORIZE_URI"
    private const val EXTRA_INTENT_LAUNCHED = "com.auth0.android.EXTRA_INTENT_LAUNCHED"

    fun authenticateUsingBrowser(activity: Activity) {
      val intent = Intent(activity, AuthenticationActivity::class.java)

      // val authorizeUri = Uri.parse(AuthorizeUrlGenerator().generate().first)
      val authorizeUri = Uri.parse("https://google.com")
      intent.putExtra(EXTRA_AUTHORIZE_URI, authorizeUri)
      intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
      activity.startActivityForResult(intent, FRONTEGG_OAUTH_LOGIN_REQUEST)
    }
  }
}
