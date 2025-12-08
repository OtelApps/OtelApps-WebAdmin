<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name', 'Otel Apps Hotel') }}</title>
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <div class="min-h-screen flex flex-col">
        <!-- Top Navigation -->
        <livewire:navigation.main-navigation />
        
        <div class="flex flex-1 overflow-hidden">
            <!-- Sidebar -->
            <livewire:navigation.sidebar />
            
            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                {{ $slot }}
            </main>
        </div>
    </div>
    
    @livewireScripts
</body>
</html>
