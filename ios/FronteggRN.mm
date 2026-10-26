#import <React/RCTBridgeModule.h>
#import "React/RCTEventEmitter.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNFronteggRNSpec.h"
#endif

@interface RCT_EXTERN_MODULE(FronteggRN, RCTEventEmitter)

RCT_EXTERN_METHOD(subscribe)
RCT_EXTERN_METHOD(
                  logout: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  login: (NSString *)loginHint
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  loginWithOptions: (NSString *)loginHint
                  customization: (NSDictionary *)customization
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  isLoginBoxCustomizationSupported: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  switchTenant: (NSString *)tenantId
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  directLoginAction: (NSString *)type
                  data: (NSString *)data
                  ephemeralSession: (BOOL)ephemeralSession
                  additionalQueryParams: (nullable NSDictionary *)additionalQueryParams
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  refreshToken: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  getOrRefreshAccessToken: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  loginWithPasskeys: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  registerPasskeys: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  requestAuthorize: (NSString *)refreshToken
                  deviceTokenCookie: (nullable NSString *)deviceTokenCookie
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  isSteppedUp: (double)maxAgeSeconds
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  stepUp: (double)maxAgeSeconds
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  openAdminPortal: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  loadEntitlements: (BOOL)forceRefresh
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  getFeatureEntitlement: (NSString *)key
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  getPermissionEntitlement: (NSString *)key
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  initWithRegion: (NSString *)regionKey
                  resolve: (RCTPromiseResolveBlock)resolve
                  reject: (RCTPromiseRejectBlock)reject
                  )
@end

#ifdef RCT_NEW_ARCH_ENABLED
// The spec methods are implemented in FronteggRN.swift, which clang cannot see from here.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wprotocol"
@interface FronteggRN (TurboModule) <NativeFronteggRNSpec>
@end

@implementation FronteggRN (TurboModule)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeFronteggRNSpecJSI>(params);
}

@end
#pragma clang diagnostic pop
#endif
