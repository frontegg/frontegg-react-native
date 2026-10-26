package com.frontegg.reactnative

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider


class FronteggRNPackage : TurboReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == FronteggRNModule.NAME) {
      FronteggRNModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        FronteggRNModule.NAME to ReactModuleInfo(
          FronteggRNModule.NAME,
          FronteggRNModule.NAME,
          false,
          false,
          true,
          false,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        )
      )
    }
  }
}
