<div class="p-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Manage your hotel app</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Hotel Overview Card -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hotel Overview</h2>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Guests staying:</span>
                    <span class="font-semibold text-gray-900 dark:text-white">84/100</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Arrivals / Departures:</span>
                    <span class="font-semibold text-gray-900 dark:text-white">12 / 8</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Occupancy:</span>
                    <span class="font-semibold text-gray-900 dark:text-white">84%</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Trend:</span>
                    <span class="text-green-500 font-semibold flex items-center">
                        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        +5%
                    </span>
                </div>
            </div>
            <div class="mt-6 flex space-x-3">
                <button class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    Manage Rooms
                </button>
                <button class="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    View Reservations
                </button>
            </div>
        </div>

        <!-- Guest Requests Card -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Guest Requests</h2>
                <span class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">12</span>
            </div>
            <div class="space-y-3 mb-4">
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Room 304: Extra towels</span>
                    <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Room 112: Late checkout</span>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">In Progress</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Room 501: Spa booking</span>
                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Done</span>
                </div>
            </div>
            <div class="flex space-x-3">
                <button class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    Create New
                </button>
                <button class="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    View All
                </button>
            </div>
        </div>

        <!-- Revenue & Upsell Card -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Revenue & Upsell</h2>
            <div class="mb-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">Today's Revenue</p>
                <p class="text-3xl font-bold text-gray-900 dark:text-white">$1,250</p>
            </div>
            <div class="mb-4">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Top Services</p>
                <div class="flex h-8 rounded-lg overflow-hidden">
                    <div class="bg-purple-500 flex items-center justify-center text-white text-xs font-semibold" style="width: 45%">Spa</div>
                    <div class="bg-purple-700 flex items-center justify-center text-white text-xs font-semibold" style="width: 35%">Room Service</div>
                    <div class="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold" style="width: 20%">Restaurant</div>
                </div>
            </div>
            <div class="flex space-x-3">
                <button class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    Add Offer
                </button>
                <button class="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    Open Insights
                </button>
            </div>
        </div>

        <!-- Add Content Card -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Content</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Enrich your Facilities and Services in just a couple clicks</p>
            <button class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                ADD CONTENT
            </button>
        </div>

        <!-- Customize your App Card -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Customize your App</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Use your Colours, Logo, Images and Icons</p>
            <button class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                EDIT STYLE
            </button>
        </div>

        <!-- Manage Requests Card -->
        <div class="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manage Requests</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage all Requests and Reservations from ACTIVITY</p>
            <button class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                MANAGE REQUESTS
            </button>
        </div>
    </div>
</div>
