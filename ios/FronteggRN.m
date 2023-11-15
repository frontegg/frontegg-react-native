
#import <React/RCTBridgeModule.h>
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(FronteggRN, RCTEventEmitter)

  RCT_EXTERN_METHOD(subscribe)
  RCT_EXTERN_METHOD(logout)
  RCT_EXTERN_METHOD(
    login: (RCTPromiseResolveBlock)resolve
    rejecter: (RCTPromiseRejectBlock)reject
  )
  RCT_EXTERN_METHOD(
    switchTenant: (NSString *)tenantId
    resolver: (RCTPromiseResolveBlock)resolve
    rejecter: (RCTPromiseRejectBlock)reject
  )
  RCT_EXTERN_METHOD(
    refreshToken: (RCTPromiseResolveBlock)resolve
    rejecter: (RCTPromiseRejectBlock)reject
  )
@end
