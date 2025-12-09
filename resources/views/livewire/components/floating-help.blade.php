<div x-data="{ open: false }" class="fixed bottom-6 right-6 z-[9999]" style="position: fixed; bottom: 1.5rem; right: 1.5rem;">
    <!-- Floating Button -->
    <button 
        @click="open = !open"
        class="w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-orange-500/50"
        style="box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(249, 115, 22, 0.1);"
    >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    </button>

    <!-- Backdrop -->
    <div 
        x-show="open"
        @click="open = false"
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        x-cloak
        class="fixed inset-0 bg-black bg-opacity-25 z-[9998]"
        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; margin: 0; padding: 0;"
    ></div>

    <!-- Modal -->
    <div 
        x-show="open"
        @click.stop
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0 translate-x-4"
        x-transition:enter-end="opacity-100 translate-x-0"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100 translate-x-0"
        x-transition:leave-end="opacity-0 translate-x-4"
        x-cloak
        class="fixed bg-white rounded-lg overflow-hidden z-[9999]"
        style="top: 50%; right: 1.5rem; transform: translateY(-50%); width: 380px; max-width: calc(100vw - 3rem); box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.5);"
    >
        <!-- Modal Header with Blue Gradient -->
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-6 pt-8 pb-6">
            <h3 class="text-center text-gray-800 font-semibold text-base">
                How can we help you from Otel Apps?
            </h3>
        </div>

        <!-- Modal Content -->
        <div class="p-6">
            <!-- Options -->
            <div class="space-y-4">
                <!-- Request content change -->
                <button class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-gray-900 mb-1 text-sm">Request content change</h4>
                            <p class="text-sm text-gray-600 leading-relaxed">Send us the content of your app and we will update it for you</p>
                        </div>
                    </div>
                </button>

                <!-- Report an issue -->
                <button class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-gray-900 mb-1 text-sm">Report an issue</h4>
                            <p class="text-sm text-gray-600 leading-relaxed">Let us know any problem you have with the platform</p>
                        </div>
                    </div>
                </button>

                <!-- New feature -->
                <button class="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-semibold text-gray-900 mb-1 text-sm">New feature</h4>
                            <p class="text-sm text-gray-600 leading-relaxed">Send us your request for new features and we will attend you as soon as possible</p>
                        </div>
                    </div>
                </button>
            </div>

            <!-- Footer Button -->
            <div class="mt-6 text-center">
                <button 
                    @mouseenter="$el.style.color = '#f97316'"
                    @mouseleave="$el.style.color = '#111827'"
                    class="text-gray-900 font-semibold transition-colors cursor-pointer bg-transparent border-none p-0"
                    style="color: #111827; font-size: 1.4em;"
                >
                    START CHAT
                </button>
            </div>
        </div>
    </div>

    <style>
        [x-cloak] { display: none !important; }
    </style>
</div>
