# OtelApps WebAdmin

Webová administrační aplikace pro správu hotelové mobilní aplikace. Umožňuje hotelovému personálu spravovat obsah, rezervace, požadavky hostů a další funkce prostřednictvím modulárního systému.

## Technologie

- **Laravel 12** - PHP framework
- **Livewire 3** - Full-stack framework pro Laravel (reaktivní komponenty)
- **Tailwind CSS 4** - Utility-first CSS framework
- **Alpine.js** - Lightweight JavaScript framework pro interaktivitu
- **Supabase** - Backend-as-a-Service (PostgreSQL databáze)

## Instalace

1. **Nainstalujte závislosti:**
```bash
composer install
npm install
```

2. **Nastavte prostředí:**
```bash
cp .env.example .env
php artisan key:generate
```

3. **Nakonfigurujte Supabase:**

   Otevřete `.env` soubor a nastavte následující proměnné:
   
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase Database Connection
DB_CONNECTION=supabase
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_DB_HOST=db.[project-ref].supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_DATABASE=postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-password
```

4. **Spusťte migrace:**
```bash
php artisan migrate
```

5. **Spusťte vývojový server:**
```bash
php artisan serve
npm run dev
```

Aplikace bude dostupná na `http://localhost:8000`

## Struktura projektu

### Hlavní adresáře

```
app/
├── Livewire/
│   ├── Navigation/          # Navigační komponenty
│   │   ├── MainNavigation.php
│   │   └── Sidebar.php
│   ├── Pages/              # Hlavní stránky aplikace
│   │   ├── Dashboard.php
│   │   ├── Content.php
│   │   ├── Activity.php
│   │   ├── Crm.php
│   │   ├── Feedback.php
│   │   ├── Concierge.php
│   │   └── Insights.php
│   └── Modules/            # Modulární komponenty
│       └── Facilities/
│           ├── RestaurantsBars.php
│           ├── WellnessSpa.php
│           ├── Sports.php
│           └── OtherFacilities.php
└── Services/
    └── ModuleService.php   # Služba pro správu modulů

resources/
└── views/
    └── livewire/
        ├── layout.blade.php
        ├── navigation/
        ├── pages/
        └── modules/

config/
└── modules.php            # Konfigurace modulů (zapínání/vypínání)

routes/
└── web.php                # Routes aplikace
```

## Modulární systém

Aplikace používá modulární architekturu, kde každý modul může být zapnutý nebo vypnutý pomocí konfiguračního souboru.

### Konfigurace modulů

Konfigurace modulů se nachází v `config/modules.php`:

```php
'enabled' => [
    // Hlavní sekce
    'dashboard' => true,
    'content' => true,
    'my_app' => true,
    'activity' => true,
    'crm' => true,
    'feedback' => true,
    'concierge' => true,
    'insights' => true,

    // Content moduly
    'facilities' => true,
    'services' => true,
    'leisure' => true,
    'other' => true,
    'welcome_message' => true,
    'smart_assistant' => true,
    'legal_texts' => true,

    // Facilities sub-moduly
    'restaurants_bars' => true,
    'wellness_spa' => true,
    'sports' => true,
    'other_facilities' => true,

    // Funkce
    'booking_system' => true,
    'room_service' => true,
    'concierge_chat' => true,
    'upsell' => true,
    'image_gallery' => true,
    'menu_editor' => true,
    'qr_code' => true,
    'web_app_access' => true,
],
```

### Jak vypnout/zapnout modul

Jednoduše změňte hodnotu z `true` na `false` v `config/modules.php`:

```php
'crm' => false,  // Vypne CRM sekci
```

Po změně konfigurace může být potřeba vyčistit cache:
```bash
php artisan config:clear
```

### Použití ModuleService

V kódu můžete zkontrolovat, zda je modul zapnutý:

```php
use App\Services\ModuleService;

if (ModuleService::isEnabled('crm')) {
    // Zobrazit CRM funkce
}
```

## Přidávání nových modulů

### 1. Přidání modulu do konfigurace

Otevřete `config/modules.php` a přidejte nový modul:

```php
'enabled' => [
    'my_new_module' => true,
],

'labels' => [
    'my_new_module' => 'My New Module',
],

'icons' => [
    'my_new_module' => 'star',
],
```

### 2. Vytvoření Livewire komponenty

```bash
php artisan livewire:make Modules/MyNewModule
```

### 3. Přidání route

V `routes/web.php`:

```php
Route::get('/module/{type}/{module}', function ($type, $module) {
    $componentMap = [
        'my_new_module' => MyNewModule::class,
        // ... další moduly
    ];
    // ...
})->name('module');
```

### 4. Přidání do navigace

V `app/Services/ModuleService.php` upravte metody `getMainNavigation()` nebo `getSidebarModules()` podle potřeby.

## Přidávání logiky

### Livewire komponenty

Logika se přidává do Livewire komponent v `app/Livewire/`:

```php
namespace App\Livewire\Pages;

use Livewire\Component;

class Dashboard extends Component
{
    public $data = [];

    public function mount()
    {
        // Inicializace při načtení komponenty
        $this->loadData();
    }

    public function loadData()
    {
        // Načtení dat z databáze nebo API
        $this->data = [];
    }

    public function render()
    {
        return view('livewire.pages.dashboard')
            ->layout('livewire.layout');
    }
}
```

### View soubory

View soubory se nacházejí v `resources/views/livewire/` a používají Blade syntax:

```blade
<div>
    <h1>{{ $title }}</h1>
    
    @if($data)
        @foreach($data as $item)
            <div>{{ $item->name }}</div>
        @endforeach
    @endif
</div>
```

### Databázové modely

Vytvořte model pro práci s databází:

```bash
php artisan make:model Restaurant -m
```

Model bude v `app/Models/Restaurant.php`, migrace v `database/migrations/`.

### Services

Pro složitější logiku vytvořte Service třídy v `app/Services/`:

```php
namespace App\Services;

class RestaurantService
{
    public function getAllRestaurants()
    {
        // Logika pro získání všech restaurací
    }
}
```

## Routes

Routes jsou definovány v `routes/web.php`:

- **Hlavní stránky**: `/dashboard`, `/content`, `/activity`, atd.
- **Moduly**: `/module/{type}/{module}`

Příklad:
- `/module/facilities/restaurants_bars` - Zobrazí modul Restaurants & Bars

## Styling

Aplikace používá Tailwind CSS. Styly jsou v `resources/css/app.css`.

### Přidání vlastních stylů

```css
/* resources/css/app.css */
@import 'tailwindcss';

/* Vlastní styly */
.custom-class {
    /* ... */
}
```

### Dark mode

Tailwind dark mode je podporován pomocí `dark:` prefixu:

```blade
<div class="bg-white dark:bg-gray-800">
    <p class="text-gray-900 dark:text-white">Text</p>
</div>
```

## Navigace

### Hlavní navigace (Top Bar)

Hlavní navigace se nachází v `app/Livewire/Navigation/MainNavigation.php` a zobrazuje pouze zapnuté moduly z `config/modules.php`.

### Sidebar

Sidebar se nachází v `app/Livewire/Navigation/Sidebar.php` a zobrazuje moduly podle konfigurace.

## Přidávání nových stránek

1. **Vytvořte Livewire komponentu:**
```bash
php artisan make:livewire Pages/MyNewPage
```

2. **Upravte komponentu:**
```php
public function render()
{
    return view('livewire.pages.my-new-page')
        ->layout('livewire.layout');
}
```

3. **Vytvořte view:**
V `resources/views/livewire/pages/my-new-page.blade.php`

4. **Přidejte route:**
V `routes/web.php` přidejte do `$componentMap` v route handleru.

5. **Přidejte do konfigurace modulů:**
V `config/modules.php` přidejte `'my_new_page' => true`.

## API a databáze

### Supabase připojení

Pro práci s Supabase databází použijte:

```php
use Illuminate\Support\Facades\DB;

// Použití Supabase připojení
$data = DB::connection('supabase')
    ->table('restaurants')
    ->get();
```

### Eloquent modely

Pro standardní Laravel modely:

```php
use App\Models\Restaurant;

$restaurants = Restaurant::all();
```

## Vývoj

### Spuštění vývojového serveru

```bash
# Terminal 1 - Laravel server
php artisan serve

# Terminal 2 - Vite dev server
npm run dev
```

### Build produkční verze

```bash
npm run build
```

### Cache management

```bash
# Vyčistit cache
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Optimalizace
php artisan optimize
```

## Bezpečnost

- Všechny routes by měly být chráněny autentizací (zatím není implementováno)
- Validace vstupů pomocí Laravel Request tříd
- CSRF ochrana je automaticky zapnutá v Livewire

## Testování

```bash
# Spuštění testů
php artisan test
```

## Deployment

1. Nastavte produkční prostředí v `.env`
2. Spusťte migrace: `php artisan migrate --force`
3. Build assets: `npm run build`
4. Optimalizace: `php artisan optimize`

## Dokumentace

- [Laravel Dokumentace](https://laravel.com/docs)
- [Livewire Dokumentace](https://livewire.laravel.com/docs)
- [Tailwind CSS Dokumentace](https://tailwindcss.com/docs)
- [Alpine.js Dokumentace](https://alpinejs.dev/)
- [Supabase Dokumentace](https://supabase.com/docs)

## Struktura modulů

Každý modul by měl obsahovat:

1. **Livewire komponentu** v `app/Livewire/Modules/`
2. **View soubor** v `resources/views/livewire/modules/`
3. **Route** v `routes/web.php`
4. **Konfiguraci** v `config/modules.php`

## Tipy pro vývoj

- Používejte Livewire pro reaktivní komponenty
- Alpine.js pro jednoduchou interaktivitu (dropdowns, modals)
- Tailwind utility třídy pro styling
- ModuleService pro kontrolu zapnutých modulů
- Respektujte modulární strukturu

## Podpora

Pro otázky a problémy kontaktujte vývojový tým.
