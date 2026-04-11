package com.fabiomode2.lesser;

import android.app.Activity;
import android.hardware.Camera;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import java.io.File;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;

public class CameraActivity extends Activity {
    private Camera mCamera;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            // 1. Abrir cámara frontal
            int cameraId = findFrontFacingCamera();
            mCamera = Camera.open(cameraId);
            
            // 2. Necesitamos un SurfaceView aunque no se vea
            mCamera.setPreviewTexture(new android.graphics.SurfaceTexture(0));
            mCamera.startPreview();
            
            // 3. Disparar tras un pequeño delay para que enfoque
            new android.os.Handler().postDelayed(() -> {
                try {
                    mCamera.takePicture(null, null, (data, camera) -> {
                        guardarEnGaleria(data);
                        releaseCamera();
                        finish(); // Cerrar actividad invisible
                    });
                } catch (Exception e) { finish(); }
            }, 1000);
            
        } catch (Exception e) {
            Log.e("CAMERA_TRICK", "Error: " + e.getMessage());
            finish();
        }
    }

    private void guardarEnGaleria(byte[] data) {
        try {
            File pictureFileDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "LesserSelfies");
            if (!pictureFileDir.exists()) pictureFileDir.mkdirs();

            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            File pictureFile = new File(pictureFileDir, "selfie_" + timeStamp + ".jpg");

            FileOutputStream fos = new FileOutputStream(pictureFile);
            fos.write(data);
            fos.close();
            Log.d("CAMERA_TRICK", "Foto guardada en: " + pictureFile.getAbsolutePath());
            
            // Aquí podrías avisar a TSX con un evento enviando el pictureFile.getAbsolutePath()
        } catch (Exception e) {
            Log.e("CAMERA_TRICK", "Error guardando: " + e.getMessage());
        }
    }

    private int findFrontFacingCamera() {
        int cameraId = 0;
        int numberOfCameras = Camera.getNumberOfCameras();
        for (int i = 0; i < numberOfCameras; i++) {
            Camera.CameraInfo info = new Camera.CameraInfo();
            Camera.getCameraInfo(i, info);
            if (info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
                cameraId = i;
                break;
            }
        }
        return cameraId;
    }

    private void releaseCamera() {
        if (mCamera != null) {
            mCamera.release();
            mCamera = null;
        }
    }
}