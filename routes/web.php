<?php

use Illuminate\Support\Facades\Route;
use App\Services\ModuleService;

// API Routes for React - musí být před catch-all route
Route::prefix('api')->group(function () {
    Route::get('/modules/main-navigation', function () {
        $modules = ModuleService::getMainNavigation();
        $labels = [];
        foreach ($modules as $module) {
            $labels[$module] = ModuleService::getLabel($module);
        }
        
        return response()->json([
            'modules' => array_values($modules), // Ensure it's a numeric array
            'labels' => $labels,
        ]);
    });

    Route::get('/modules/sidebar', function () {
        $sidebarModules = ModuleService::getSidebarModules();
        $result = [];
        
        foreach ($sidebarModules as $key => $value) {
            if (is_array($value)) {
                // Section with submodules
                $result[] = [
                    'key' => $key,
                    'label' => ModuleService::getLabel($key),
                    'submodules' => array_map(fn($m) => [
                        'key' => $m,
                        'label' => ModuleService::getLabel($m),
                    ], $value),
                ];
            } else {
                // Simple module
                $result[] = [
                    'key' => $value,
                    'label' => ModuleService::getLabel($value),
                ];
            }
        }
        
        return response()->json(['modules' => $result]);
    });

    Route::get('/modules/check/{module}', function ($module) {
        return response()->json([
            'enabled' => ModuleService::isEnabled($module),
        ]);
    });

    Route::get('/modules/check/{type}/{module}', function ($type, $module) {
        // Zkontroluj oba - type i module
        $typeEnabled = ModuleService::isEnabled($type);
        $moduleEnabled = ModuleService::isEnabled($module);
        
        return response()->json([
            'enabled' => $typeEnabled && $moduleEnabled,
        ]);
    });

    // Restaurant/Bars API endpoints
    Route::post('/restaurants/{id}/save', function ($id) {
        $data = json_decode(request()->input('data'), true);
        
        // TODO: Uložit data do databáze podle ID
        // Prozatím jen vracíme success
        
        return response()->json([
            'success' => true,
            'message' => 'Data saved successfully',
        ]);
    });

    Route::post('/restaurants/{id}/upload-image', function ($id) {
        $request = request();
        
        if (!$request->hasFile('image')) {
            return response()->json([
                'success' => false,
                'message' => 'No image file provided',
            ], 400);
        }

        $file = $request->file('image');
        $imageId = $request->input('image_id');
        
        // Validate file size (1 MB)
        if ($file->getSize() > 1024 * 1024) {
            return response()->json([
                'success' => false,
                'message' => 'File size must be less than 1 MB',
            ], 400);
        }

        // Validate file type
        if (!str_starts_with($file->getMimeType(), 'image/')) {
            return response()->json([
                'success' => false,
                'message' => 'File must be an image',
            ], 400);
        }

        // Generate unique filename
        $filename = 'restaurant_' . $id . '_' . $imageId . '_' . time() . '.' . $file->getClientOriginalExtension();
        
        // Store file in public storage
        $path = $file->storeAs('restaurants', $filename, 'public');
        
        // Return URL to the stored file
        $url = asset('storage/' . $path);
        
        // TODO: Uložit URL do databáze podle ID a image_id
        
        return response()->json([
            'success' => true,
            'url' => $url,
            'message' => 'Image uploaded successfully',
        ]);
    });
});

// React SPA Route - všechny ostatní routes budou řešeny React Routerem
// Musí být na konci, aby nezachytával API routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
