<?php

use App\Services\DeviceTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Temporary debug routes to test device info capture
Route::get('/debug/device-test', function () {
    return view('test-device');
})->middleware('web');

Route::post('/debug/device-info', function (Request $request, DeviceTrackingService $deviceService) {
    $deviceInfo = $deviceService->getDeviceInfo($request);
    
    return response()->json([
        'headers' => [
            'X-Device-Model' => $request->header('X-Device-Model'),
            'X-Device-Serial' => $request->header('X-Device-Serial'),
            'X-Device-Mac' => $request->header('X-Device-Mac'),
        ],
        'input' => [
            'device_model' => $request->input('device_model'),
            'device_serial' => $request->input('device_serial'),
            'device_mac' => $request->input('device_mac'),
        ],
        'cookies' => [
            'device_model' => $request->cookie('device_model'),
            'device_serial' => $request->cookie('device_serial'),
            'device_mac' => $request->cookie('device_mac'),
        ],
        'captured_device_info' => $deviceInfo,
        'all_headers' => $request->headers->all(),
        'all_input' => $request->all(),
    ]);
})->middleware('web');
