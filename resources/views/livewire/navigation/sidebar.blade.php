<aside class="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto h-full">
    <div class="p-4">
        @foreach($modules as $key => $value)
            @if(is_array($value))
                <!-- Section with sub-items -->
                <div class="mb-4">
                    <button 
                        wire:click="toggleSection('{{ $key }}')"
                        class="w-full flex items-center justify-between px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors
                            {{ in_array($key, $expandedSections) ? 'bg-orange-50 dark:bg-orange-900/20' : '' }}"
                    >
                        <div class="flex items-center space-x-2">
                            <span class="font-semibold">{{ \App\Services\ModuleService::getLabel($key) }}</span>
                        </div>
                        <svg 
                            class="w-5 h-5 transition-transform {{ in_array($key, $expandedSections) ? 'rotate-180' : '' }}"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    @if(in_array($key, $expandedSections))
                        <div class="mt-2 space-y-1">
                            @foreach($value as $subModule)
                                <a 
                                    href="/module/{{ $key }}/{{ $subModule }}"
                                    class="block px-6 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors
                                        {{ request()->is('module/' . $key . '/' . $subModule) ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : '' }}"
                                >
                                    {{ \App\Services\ModuleService::getLabel($subModule) }}
                                </a>
                            @endforeach
                        </div>
                    @endif
                </div>
            @else
                <!-- Simple module -->
                <a 
                    href="/module/{{ $value }}/{{ $value }}"
                    class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors mb-2
                        {{ request()->is('module/' . $value . '/' . $value) ? 'bg-orange-50 dark:bg-orange-900/20' : '' }}"
                >
                    <span class="font-medium">{{ \App\Services\ModuleService::getLabel($value) }}</span>
                </a>
            @endif
        @endforeach
    </div>
</aside>
