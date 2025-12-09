<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name', 'Otel Apps Hotel') }}</title>
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body class="bg-gray-50 dark:bg-gray-900" x-data="{ settingsOpen: false }" @settings-toggle.window="settingsOpen = $event.detail" @settings-close.window="settingsOpen = false">
    <!-- Global Backdrop for Settings -->
    <div 
        x-show="settingsOpen"
        @click="settingsOpen = false; $dispatch('settings-close')"
        x-transition:enter="transition ease-out duration-200"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-in duration-150"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        x-cloak
        class="fixed inset-0 bg-black bg-opacity-40 z-[9997]"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;"
    ></div>

    <div class="min-h-screen flex flex-col">
        <!-- Top Navigation -->
        <livewire:navigation.main-navigation />
        
        <div class="flex flex-1 overflow-hidden">
            <!-- Sidebar -->
            @if (!request()->is('dashboard'))
                <livewire:navigation.sidebar />
            @endif
            
            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                {{ $slot }}
            </main>
        </div>
    </div>
    
    <!-- Floating Help Button - outside main container for proper positioning -->
    <livewire:components.floating-help />
    
    @livewireScripts
</body>
</html>
