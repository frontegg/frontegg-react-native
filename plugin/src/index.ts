import { createRunOncePlugin, type ConfigPlugin } from 'expo/config-plugins';

import { withFronteggAndroid } from './android';
import type { FronteggPluginProps } from './config';
import { withFronteggIos } from './ios';

const packageJson = require('../../package.json');

const withFrontegg: ConfigPlugin<FronteggPluginProps> = (
  config,
  props = {}
) => {
  config = withFronteggIos(config, props);
  return withFronteggAndroid(config, props);
};

export type { FronteggPluginProps, FronteggRegion } from './config';

export default createRunOncePlugin(
  withFrontegg,
  packageJson.name,
  packageJson.version
);
