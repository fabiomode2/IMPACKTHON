const { withMainApplication, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withOverlayModule = (config) => {
  // 1. Añadimos el servicio en el AndroidManifest.xml
  config = withAndroidManifest(config, async config => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application[0];

    // Nos aseguramos que el MainActivity sigue ahí por si acaso
    if (!application.service) {
      application.service = [];
    }
    
    // No necesitamos un servicio necesariamente, podemos crear el overlay desde ReactContextBaseJavaModule.
    // Solo necesitamos los permisos que ya están en app.json (SYSTEM_ALERT_WINDOW)
    return config;
  });

  // 2. Inyectar la clase de Java al compilar
  config = withMainApplication(config, async config => {
    const srcPath = config.modRequest.projectRoot;
    const packageFolder = config.android.package.replace(/\./g, '/');
    const destPath = path.join(
      srcPath,
      'android',
      'app',
      'src',
      'main',
      'java',
      packageFolder,
      'OverlayModule.java'
    );
    const packageDestPath = path.join(
      srcPath,
      'android',
      'app',
      'src',
      'main',
      'java',
      packageFolder,
      'OverlayPackage.java'
    );

    const javaCode = `package ${config.android.package};

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class OverlayModule extends ReactContextBaseJavaModule {
    private WindowManager windowManager;
    private View overlayView;

    public OverlayModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "OverlayModule";
    }

    @ReactMethod
    public void startOverlay(Promise promise) {
        if (!Settings.canDrawOverlays(getReactApplicationContext())) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getReactApplicationContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            promise.reject("PERMISSION_DENIED", "System Alert Window permission required.");
            return;
        }

        getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (overlayView != null) {
                        promise.resolve(null);
                        return; // Already showing
                    }

                    windowManager = (WindowManager) getReactApplicationContext().getSystemService(Context.WINDOW_SERVICE);
                    overlayView = new View(getReactApplicationContext());
                    overlayView.setBackgroundColor(Color.argb(100, 100, 100, 100)); // Semitransparent Gray

                    WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                            WindowManager.LayoutParams.MATCH_PARENT,
                            WindowManager.LayoutParams.MATCH_PARENT,
                            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE,
                            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                            PixelFormat.TRANSLUCENT);

                    params.gravity = Gravity.TOP | Gravity.LEFT;
                    windowManager.addView(overlayView, params);
                    promise.resolve(null);
                } catch (Exception e) {
                    promise.reject("ERROR", e.getMessage());
                }
            }
        });
    }

    @ReactMethod
    public void stopOverlay(Promise promise) {
        if (overlayView == null) {
            promise.resolve(null);
            return;
        }
        getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (windowManager != null && overlayView != null) {
                        windowManager.removeView(overlayView);
                        overlayView = null;
                    }
                    promise.resolve(null);
                } catch (Exception e) {
                    promise.reject("ERROR", e.getMessage());
                }
            }
        });
    }
}
`;

    const packageCode = `package ${config.android.package};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class OverlayPackage implements ReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new OverlayModule(reactContext));
        return modules;
    }
}
`;

    // Ensure directory exists
    const dirname = path.dirname(destPath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }

    fs.writeFileSync(destPath, javaCode);
    fs.writeFileSync(packageDestPath, packageCode);

    // Now we must auto-register this package in MainApplication.kt
    let mainAppCode = config.modResults.contents;
    
    // Kotlin registration
    if (mainAppCode.includes("PackageList(this).packages")) {
      mainAppCode = mainAppCode.replace(
        "PackageList(this).packages.apply {",
        "PackageList(this).packages.apply {\n          add(OverlayPackage())"
      );
    }
    
    config.modResults.contents = mainAppCode;

    return config;
  });

  return config;
};

module.exports = withOverlayModule;
