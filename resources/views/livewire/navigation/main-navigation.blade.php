<nav class="bg-gray-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                    <img src="{{ asset('logo.png') }}" alt="Otel Apps Hotel" class="max-h-10 max-w-10 object-contain">
                </div>
                <div class="ml-3">
                    <span class="text-xl font-semibold">Otel Apps Hotel</span>
                </div>
            </div>

            <!-- Navigation Links -->
            <div class="flex items-center space-x-1">
                @foreach($modules as $module)
                    <a 
                        href="/{{ $module }}"
                        class="px-4 py-2 rounded-md text-sm font-medium transition-colors
                            {{ request()->is($module) || request()->is($module . '/*') || (request()->is('/') && $module === 'dashboard')
                                ? 'bg-orange-500 text-white' 
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white' }}"
                    >
                        <div class="flex items-center space-x-2">
                            <span>{{ \App\Services\ModuleService::getLabel($module) }}</span>
                        </div>
                    </a>
                @endforeach
            </div>

            <!-- Settings & Language -->
            <div class="flex items-center space-x-4">
                <button class="text-gray-300 hover:text-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <span class="text-gray-300">ENG</span>
            </div>
        </div>
    </div>
</nav>
