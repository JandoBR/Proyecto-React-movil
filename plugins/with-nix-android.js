const fs = require('fs');
const path = require('path');
const { withGradleProperties } = require('expo/config-plugins');

const setProperty = (config, key, value) => {
  config.modResults = config.modResults.filter(
    (item) => !(item.type === 'property' && item.key === key),
  );
  config.modResults.push({ type: 'property', key, value });
};

/**
 * Makes the generated android/ project build against the SDK this Nix shell
 * provides instead of downloading one into the read-only Nix store.
 * Does nothing outside a `nix develop` shell (ANDROID_HOME under /nix/store),
 * so EAS cloud builds are unaffected.
 */
module.exports = function withNixAndroid(config) {
  return withGradleProperties(config, (gradle) => {
    const sdk = process.env.ANDROID_HOME;
    if (!sdk || !sdk.startsWith('/nix/store')) {
      return gradle;
    }

    // A missing component is then named by the build instead of a permission
    // error halfway through: add that version to flake.nix.
    setProperty(gradle, 'android.builder.sdkDownload', 'false');

    // The aapt2 that Gradle fetches from Maven is linked against
    // /lib64/ld-linux-x86-64.so.2, which NixOS does not have.
    const buildTools = path.join(sdk, 'build-tools');
    const newest = fs
      .readdirSync(buildTools)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .pop();
    setProperty(gradle, 'android.aapt2FromMavenOverride', path.join(buildTools, newest, 'aapt2'));

    return gradle;
  });
};
