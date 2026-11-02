{
  description = "React Native / Expo app: Node, a JDK and the Android SDK";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true; # the Android SDK is unfree
            android_sdk.accept_license = true; # and has a licence to accept
          };
        };

        # These follow the Expo SDK / React Native in package.json (SDK 57,
        # RN 0.86: compileSdk 36, build-tools 36.0.0, NDK 27.1.12297006).
        # When a build names a missing build-tools, platform, NDK or CMake
        # version, add that exact version here. Nothing else can fetch it:
        # the SDK lives in the read-only Nix store, so Gradle cannot download
        # into it (hence android.builder.sdkDownload=false, see below).
        androidComposition = pkgs.androidenv.composeAndroidPackages {
          buildToolsVersions = [
            "35.0.0"
            "36.0.0"
          ];
          platformVersions = [
            "35"
            "36"
          ];
          abiVersions = [
            "arm64-v8a"
            "x86_64"
          ];
          cmakeVersions = [ "3.22.1" ];
          includeNDK = true;
          ndkVersions = [ "27.1.12297006" ];

          includeSystemImages = false; # a real phone is the test device
          includeEmulator = false;
          useGoogleAPIs = false;
        };

        androidSdk = androidComposition.androidsdk;
        jdk = pkgs.jdk17;
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_24 # package.json asks for ^22.13 || >=24.3
            jdk
            androidSdk
            pkgs.git
            pkgs.curl
          ];

          shellHook = ''
            export ANDROID_HOME="${androidSdk}/libexec/android-sdk"
            export ANDROID_SDK_ROOT="$ANDROID_HOME"
            export JAVA_HOME="${jdk}"
            export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

            # Metro watches the whole tree; the default inotify limit is small.
            max=$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo 0)
            if [ "$max" -lt 200000 ]; then
              echo "note: fs.inotify.max_user_watches is $max; Metro may run out (raise it on the host)."
            fi

            echo "node $(node --version) · $(java -version 2>&1 | head -n1) · sdk $ANDROID_HOME"
          '';
        };

        # Without the Android SDK, for lint, tests and the web build.
        devShells.js = pkgs.mkShell {
          packages = [ pkgs.nodejs_24 ];
        };
      }
    );
}
