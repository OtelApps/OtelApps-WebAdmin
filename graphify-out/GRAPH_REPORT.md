# Graph Report - .  (2026-07-28)

## Corpus Check
- 351 files · ~280,340 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1630 nodes · 4181 edges · 143 communities (76 shown, 67 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 156 edges (avg confidence: 0.8)
- Token cost: 862,115 input · 0 output

## Community Hubs (Navigation)
- Concierge Bot Backend
- Concierge Chat Frontend
- React App Shell & Routing
- Facility & Amenity Models
- Hotel CRM Models
- Dashboard Widgets
- Venue & Restaurant API
- NPM Dependencies
- Hotel Model & Relations
- Layout & Notifications UI
- Guest Push Notifications
- API Controllers Overview
- Facility Content Pages
- Insights Service
- CRM Controller
- Hotel Room Controller
- UI Skeletons & Loading States
- Hotel Supplies Controller
- Guest Profile & Push Tokens
- Wellness Controller
- Notification Service
- Hotel Info Controller
- Models
- Module Service
- Fitness Controller
- Utils
- Venue Menus Tab
- Open Ai Service
- Relax Sport Controller
- Readme
- Hotel Housekeeping Controller
- Hotel Maintenance Controller
- Sports
- Providers
- Hotel Parking Controller
- Hotel Place Service
- Composer
- Composer
- Concierge Guest Ops Service
- Tabs
- Layout Blocks
- Facilities Services Survey
- Hotel Service Request Controller
- Laundry
- Tabs
- Hotel Room Service Controller
- User
- Activity Revenue Service
- Crm Service
- Additional Info Modal
- Feedback Inbox
- Hotel Place Controller
- Insights Controller
- Composer
- Ui
- Checkout Survey
- Generic Survey
- Welcome Survey
- Composer
- External Platforms
- Notification Controller
- Composer
- Composer
- Issues Repairs Catalog Tab
- Amenities Catalog Tab
- Hotel Room Type Edit
- Feedback Stats
- Hotel Housekeeping
- Hotel Maintenance
- Hotel Room Service Menu
- User Factory
- Example Test
- Wellness Services Tab
- Room Service Catalog Tab
- Hotel Housekeeping Category
- Hotel Maintenance Category
- Hotel Room Service Category
- Wellness Program Event
- Composer
- Fitness Facility Hour
- Hotel Dashboard Layout
- Hotel Service Request Status Log
- Wellness Facility Image
- Wellness Service
- Composer
- Example Test
- Composer
- Readme
- Concierge
- Guests
- Promotions
- Revenue
- Transactions
- Smart Assistant
- External Platforms
- Robots
- Otel Apps Web Admin
- Otel Apps Web Admin
- Icons
- Icons
- Icons
- Icons
- Icons
- Icons
- Icons
- Icons
- Icons
- Icons
- Icons
- Icons
- Icons
- Images
- Images
- Images
- Public
- Otel Apps Web Admin
- Otel Apps Web Admin
- Otel Apps Web Admin
- Insights
- Otel Apps Web Admin
- Otel Apps Web Admin
- Otel Apps Web Admin
- Otel Apps Web Admin

## God Nodes (most connected - your core abstractions)
1. `Hotel` - 160 edges
2. `HotelConciergeConversation` - 71 edges
3. `ConciergeBotService` - 68 edges
4. `CrmService` - 54 edges
5. `ModuleService` - 49 edges
6. `Controller` - 41 edges
7. `HotelConciergeMessage` - 36 edges
8. `HotelServiceRequest` - 30 edges
9. `InsightsService` - 30 edges
10. `CrmController` - 29 edges

## Surprising Connections (you probably didn't know these)
- `CLAUDE.md — Project Guidance for OtelApps WebAdmin` --references--> `config_array()`  [EXTRACTED]
  CLAUDE.md → app/helpers.php
- `initReact()` --references--> `react`  [EXTRACTED]
  resources/js/app.js → package.json
- `CLAUDE.md — Project Guidance for OtelApps WebAdmin` --references--> `PUSH_SETUP.md — Push Notification Setup`  [EXTRACTED]
  CLAUDE.md → PUSH_SETUP.md
- `CLAUDE.md — Project Guidance for OtelApps WebAdmin` --references--> `README.md — OtelApps WebAdmin Overview`  [EXTRACTED]
  CLAUDE.md → README.md
- `PUSH_SETUP.md — Push Notification Setup` --references--> `hotel_guest_push_tokens.sql schema`  [EXTRACTED]
  PUSH_SETUP.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Concierge AI guest-message processing flow** — app_services_conciergebotservice, app_services_openaiservice, app_jobs_processconciergeguestmessage, app_models_hotelconciergeconversation [INFERRED 0.85]
- **Guest push notification subsystem** — app_services_guestpushservice, app_services_expopushservice, app_services_guestpushaudienceresolver, database_supabase_hotel_guest_push_tokens [EXTRACTED 1.00]
- **Module config to bootstrap to frontend context flow** — config_modules, app_services_moduleservice, resources_views_app_blade, resources_js_context_modulescontext [EXTRACTED 1.00]

## Communities (143 total, 67 thin omitted)

### Community 0 - "Concierge Bot Backend"
Cohesion: 0.05
Nodes (16): ProcessConciergeGuestMessageCommand, ConciergeBotController, ConciergeChatController, Carbon, ProcessConciergeGuestMessage, HotelConciergeConversation, HotelConciergeMessage, ConciergeBotService (+8 more)

### Community 1 - "Concierge Chat Frontend"
Cohesion: 0.06
Nodes (64): http, Concierge(), ConversationListItem(), ConversationThread(), HANDLER_MODE_META, MessageBubble(), resolveHandlerMode(), GUEST_LOCALES (+56 more)

### Community 2 - "React App Shell & Routing"
Cohesion: 0.05
Nodes (50): Two frontend routing patterns (named top-level vs generic dynamic module route), resources/css/app.css, initReact(), App.jsx (resources/js/components/App.jsx), App(), Sidebar(), ProtectedRoute.jsx (resources/js/components/ProtectedRoute.jsx), ErrorBoundary (+42 more)

### Community 3 - "Facility & Amenity Models"
Cohesion: 0.07
Nodes (11): FitnessFacilityImage, HotelHousekeepingHour, HotelMaintenanceHour, HotelRoomServiceHour, HotelRoomServiceItem, HotelRoomServiceItemOption, HotelServiceRequestType, HotelSuppliesHour (+3 more)

### Community 4 - "Hotel CRM Models"
Cohesion: 0.08
Nodes (6): HotelCrmAlert, HotelCrmInteraction, HotelCrmTask, HotelServiceRequest, CrmService, Carbon

### Community 5 - "Dashboard Widgets"
Cohesion: 0.09
Nodes (35): HotelOverviewCard(), SOURCE_HINTS, RevenueUpsellPanel(), WidgetBodySkeleton(), InsightsRevenueWidget(), Behavior(), SEG, DonutChart() (+27 more)

### Community 6 - "Venue & Restaurant API"
Cohesion: 0.08
Nodes (8): VenueController, Allergen, MenuCategory, MenuItem, Venue, VenueMenu, VenueOpeningHour, Illuminate\Database\Eloquent\Relations\BelongsToMany

### Community 7 - "NPM Dependencies"
Cohesion: 0.05
Nodes (39): alpinejs, axios, concurrently, @heroicons/vue, laravel-vite-plugin, dependencies, alpinejs, @heroicons/vue (+31 more)

### Community 8 - "Hotel Model & Relations"
Cohesion: 0.12
Nodes (3): Hotel, DashboardService, Illuminate\Database\Eloquent\Relations\HasMany

### Community 9 - "Layout & Notifications UI"
Cohesion: 0.12
Nodes (25): Layout(), MainNavigation(), formatTime(), NavBadge(), NotificationBell(), SOURCE_LABELS, ACTIVITY_STATUSES, NotificationSettingsModal() (+17 more)

### Community 10 - "Guest Push Notifications"
Cohesion: 0.10
Nodes (9): ExpoPushService, GuestPushCopy, GuestPushService, hotel_guest_push_tokens.sql schema, OtelApps/PUSH_SETUP.md (mobile repo reference), PUSH_SETUP.md — Push Notification Setup, POST /api/crm/push endpoint, GET /api/crm/push/audience endpoint (+1 more)

### Community 11 - "API Controllers Overview"
Cohesion: 0.17
Nodes (6): ActivityRevenueController, Controller, Client bootstrap without round-trip (inline __OTELAPPS_BOOTSTRAP__), CLAUDE.md — Project Guidance for OtelApps WebAdmin, Illuminate\Http\Request, Modular feature-flag system (enable/disable modules via config)

### Community 12 - "Facility Content Pages"
Cohesion: 0.12
Nodes (16): RestaurantsBars(), Sports(), WellnessSpa(), ImageGallery(), MOCK_IMAGES, HotelInfo(), HotelRooms(), Parking() (+8 more)

### Community 13 - "Insights Service"
Cohesion: 0.19
Nodes (3): InsightsService, Carbon, Carbon\Carbon

### Community 15 - "Hotel Room Controller"
Cohesion: 0.16
Nodes (4): HotelRoomController, HotelRoomType, HotelRoomTypeFeature, HotelRoomTypeImage

### Community 16 - "UI Skeletons & Loading States"
Cohesion: 0.15
Nodes (15): ContentListSkeleton(), HubPageSkeleton(), PageLoadError(), useHttpQuery(), MOCK_SECTIONS, OtherFacilities(), MOCK_SECTIONS, Other() (+7 more)

### Community 17 - "Hotel Supplies Controller"
Cohesion: 0.15
Nodes (4): HotelSuppliesController, HotelSupplies, HotelSuppliesCategory, HotelSuppliesItem

### Community 18 - "Guest Profile & Push Tokens"
Cohesion: 0.21
Nodes (4): HotelCrmGuestProfile, HotelGuestPushToken, GuestPushAudienceResolver, Illuminate\Support\Collection

### Community 20 - "Notification Service"
Cohesion: 0.19
Nodes (3): HotelAdminNotification, HotelAdminNotificationSetting, NotificationService

### Community 21 - "Hotel Info Controller"
Cohesion: 0.21
Nodes (3): HotelInfoController, HotelInfoSection, HotelInfoTopic

### Community 22 - "Models"
Cohesion: 0.12
Nodes (6): HotelConciergeCaseSummary, Concierge conversation mode state machine (bot/waiting/staff), Bot replies generated in two language versions (body/body_translated), config('otelapps.db_connection') / OTELAPPS_DB_CONNECTION, System message markers instead of dedicated column, Two-database separation (Laravel default DB vs Supabase connection)

### Community 23 - "Module Service"
Cohesion: 0.17
Nodes (3): config_array(), DashboardController, ModuleService

### Community 25 - "Utils"
Cohesion: 0.26
Nodes (12): ContentCardsLayout(), AddEntityModal(), ContentCard(), ImageWithFallback(), canAddItem(), canDeleteItem(), confirmDelete(), deleteListItem() (+4 more)

### Community 26 - "Venue Menus Tab"
Cohesion: 0.14
Nodes (7): formatPrice(), ItemEditPanel(), MenuItemCard(), NAVIGATION_SCREENS, patchMenus(), slugify(), VenueMenusTab()

### Community 28 - "Relax Sport Controller"
Cohesion: 0.24
Nodes (3): RelaxSportController, HotelRelaxSport, HotelRelaxSportArea

### Community 29 - "Readme"
Cohesion: 0.14
Nodes (16): Restaurant Eloquent model (app/Models/Restaurant.php), README.md describes outdated/generic architecture version, Alpine.js 3, Axios HTTP client, Hybrid Laravel API + React SPA architecture, Laravel 12, "my_new_module" walkthrough example, README.md — OtelApps WebAdmin Overview (+8 more)

### Community 32 - "Sports"
Cohesion: 0.28
Nodes (10): useServiceEdit(), VenueEdit(), FitnessFacilityEdit(), TABS, FitnessGalleryTab(), WellnessFacilityEdit(), AmenitiesEdit(), IssuesRepairsEdit() (+2 more)

### Community 33 - "Providers"
Cohesion: 0.18
Nodes (6): PostgresEmulatedConnection, AppServiceProvider, ModuleServiceProvider, Supabase transaction pooler lacks server-side prepared statements, Illuminate\Database\PostgresConnection, Illuminate\Support\ServiceProvider

### Community 36 - "Composer"
Cohesion: 0.14
Nodes (13): description, extra, laravel, keywords, dont-discover, license, minimum-stability, name (+5 more)

### Community 37 - "Composer"
Cohesion: 0.14
Nodes (14): scripts, dev, post-autoload-dump, post-update-cmd, pre-package-uninstall, test, Composer\\Config::disableProcessTimeout, Illuminate\\Foundation\\ComposerScripts::postAutoloadDump (+6 more)

### Community 39 - "Tabs"
Cohesion: 0.22
Nodes (7): BookingSystemSelector(), CardEdit(), emptyFormData, CatalogTab(), HoursTab(), InformationTab(), UpsellTab()

### Community 40 - "Layout Blocks"
Cohesion: 0.22
Nodes (6): Field(), SectionCard(), HotelInfoSectionsTab(), BASE_TABS, HotelInfoTopicEdit(), ParkingTopicEdit()

### Community 41 - "Facilities Services Survey"
Cohesion: 0.21
Nodes (6): FacilitiesServicesConfigurationSection(), FacilitiesServicesFollowUpSection(), CATEGORIES, FacilitiesServicesQuestionsSection(), FacilitiesServicesSurvey(), FacilitiesServicesSurveyList()

### Community 43 - "Laundry"
Cohesion: 0.23
Nodes (6): FormSaveBar(), LegalTexts(), LaundryCatalogTab(), slugify(), LaundryEdit(), TABS

### Community 44 - "Tabs"
Cohesion: 0.24
Nodes (6): Leisure(), ActivityEditModal(), CalendarActivityAddModal(), LeisureActivitiesTab(), LeisureCalendarTab(), LeisureInformationTab()

### Community 46 - "User"
Cohesion: 0.27
Nodes (7): User, DatabaseSeeder, Illuminate\Database\Console\Seeds\WithoutModelEvents, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Seeder, Illuminate\Foundation\Auth\User, Illuminate\Notifications\Notifiable

### Community 49 - "Additional Info Modal"
Cohesion: 0.27
Nodes (6): AddCatalogModal(), AdditionalInfoModal(), getIcon(), OPTION_TYPES, OptionButton(), TABS

### Community 53 - "Composer"
Cohesion: 0.22
Nodes (9): require-dev, fakerphp/faker, fruitcake/laravel-debugbar, laravel/pail, laravel/pint, laravel/sail, mockery/mockery, nunomaduro/collision (+1 more)

### Community 54 - "Ui"
Cohesion: 0.31
Nodes (5): ModuleEditLayout(), HashTabs(), PageHeader(), DAY_ORDER, WellnessProgramEdit()

### Community 55 - "Checkout Survey"
Cohesion: 0.31
Nodes (5): CheckoutConfigurationSection(), CheckoutFollowUpSection(), CATEGORIES, CheckoutQuestionsSection(), CheckoutSurvey()

### Community 56 - "Generic Survey"
Cohesion: 0.31
Nodes (5): GenericConfigurationSection(), GenericFollowUpSection(), CATEGORIES, GenericQuestionsSection(), GenericSurvey()

### Community 57 - "Welcome Survey"
Cohesion: 0.31
Nodes (5): WelcomeConfigurationSection(), WelcomeFollowUpSection(), CATEGORIES, WelcomeQuestionsSection(), WelcomeSurvey()

### Community 58 - "Composer"
Cohesion: 0.25
Nodes (8): post-root-package-install, setup, composer install, npm install, npm run build, @php artisan key:generate, @php artisan migrate --force, @php -r \"file_exists('.env') || copy('.env.example', '.env');\

### Community 61 - "Composer"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 62 - "Composer"
Cohesion: 0.29
Nodes (7): autoload, files, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\, app/helpers.php

### Community 63 - "Issues Repairs Catalog Tab"
Cohesion: 0.38
Nodes (3): IssuesRepairsCatalogTab(), slugify(), TABS

### Community 64 - "Amenities Catalog Tab"
Cohesion: 0.43
Nodes (4): WeeklyHoursPicker(), AmenitiesCatalogTab(), slugify(), TABS

### Community 65 - "Hotel Room Type Edit"
Cohesion: 0.38
Nodes (4): HotelRoomFeaturesTab(), HotelRoomGalleryTab(), HotelRoomTypeEdit(), TABS

### Community 70 - "User Factory"
Cohesion: 0.47
Nodes (3): UserFactory, Illuminate\Database\Eloquent\Factories\Factory, static

### Community 71 - "Example Test"
Cohesion: 0.40
Nodes (3): Illuminate\Foundation\Testing\TestCase, ExampleTest, TestCase

### Community 72 - "Wellness Services Tab"
Cohesion: 0.53
Nodes (4): BASE_TABS, formatPrice(), slugify(), WellnessServicesTab()

### Community 73 - "Room Service Catalog Tab"
Cohesion: 0.47
Nodes (4): RoomServiceCatalogTab(), slugify(), RoomServiceEdit(), TABS

### Community 78 - "Composer"
Cohesion: 0.40
Nodes (5): require, laravel/framework, laravel/tinker, livewire/livewire, php

### Community 84 - "Composer"
Cohesion: 0.50
Nodes (4): post-create-project-cmd, @php artisan key:generate --ansi, @php artisan migrate --graceful --ansi, @php -r \"file_exists('database/database.sqlite') || touch('database/database.sqlite');\

### Community 86 - "Composer"
Cohesion: 0.67
Nodes (3): autoload-dev, psr-4, Tests\\

### Community 90 - "Readme"
Cohesion: 0.67
Nodes (3): Layout.jsx (resources/js/components/Layout.jsx), MainNavigation.jsx, Sidebar.jsx

## Knowledge Gaps
- **179 isolated node(s):** `$schema`, `name`, `type`, `description`, `laravel` (+174 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **67 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Hotel` connect `Hotel Model & Relations` to `Concierge Bot Backend`, `Facility & Amenity Models`, `Hotel CRM Models`, `Venue & Restaurant API`, `Guest Push Notifications`, `API Controllers Overview`, `Insights Service`, `CRM Controller`, `Hotel Room Controller`, `Hotel Supplies Controller`, `Guest Profile & Push Tokens`, `Wellness Controller`, `Notification Service`, `Hotel Info Controller`, `Models`, `Module Service`, `Fitness Controller`, `Relax Sport Controller`, `Hotel Housekeeping Controller`, `Hotel Maintenance Controller`, `Hotel Parking Controller`, `Hotel Place Service`, `Concierge Guest Ops Service`, `Hotel Service Request Controller`, `Hotel Room Service Controller`, `Crm Service`, `Hotel Place Controller`, `Insights Controller`, `Notification Controller`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `README.md — OtelApps WebAdmin Overview` connect `Readme` to `React App Shell & Routing`, `API Controllers Overview`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `ModuleService` connect `Module Service` to `Hotel CRM Models`, `Hotel Model & Relations`, `API Controllers Overview`, `Insights Service`, `CRM Controller`, `Insights Controller`, `Notification Service`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Hotel` (e.g. with `.resolveHousekeeping()` and `.resolveMaintenance()`) actually correct?**
  _`Hotel` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `name`, `type` to the rest of the system?**
  _179 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Concierge Bot Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.051392632524708 - nodes in this community are weakly interconnected._
- **Should `Concierge Chat Frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.05513612445664608 - nodes in this community are weakly interconnected._