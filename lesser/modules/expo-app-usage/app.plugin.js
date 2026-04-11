const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAppUsageConfig(config) {
  return withAndroidManifest(config, async (config) => {
    let androidManifest = config.modResults;
    if (!androidManifest.manifest) {
      return config;
    }
    
    if (!androidManifest.manifest.$) {
      androidManifest.manifest.$ = {};
    }
    androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    
    const permission = {
      $: {
        'android:name': 'android.permission.PACKAGE_USAGE_STATS',
        'tools:ignore': 'ProtectedPermissions'
      }
    };
    
    const hasPermission = androidManifest.manifest['uses-permission'].some(
      (p) => p.$ && p.$['android:name'] === 'android.permission.PACKAGE_USAGE_STATS'
    );
    
    if (!hasPermission) {
      androidManifest.manifest['uses-permission'].push(permission);
    }
    
    return config;
  });
};
