# OtelApps WebAdmin

Webová administrační aplikace pro správu hotelové mobilní aplikace. Umožňuje hotelovému personálu spravovat obsah, rezervace, požadavky hostů a další funkce prostřednictvím modulárního systému.

## 📋 Obsah

- [Co aplikace umí](#co-aplikace-umí)
- [Technologie](#technologie)
- [Architektura](#architektura)
- [Instalace](#instalace)
- [Struktura projektu](#struktura-projektu)
- [Jak aplikace funguje](#jak-aplikace-funguje)
- [Modulární systém](#modulární-systém)
- [Přidávání nových komponent](#přidávání-nových-komponent)
- [API a Backend](#api-a-backend)
- [Styling](#styling)
- [Vývoj](#vývoj)

---

## 🎯 Co aplikace umí

### Hlavní funkce

1. **Dashboard** - Přehledová stránka s kartami a statistikami
2. **Content Management** - Správa obsahu hotelu:
   - **Facilities** - Restaurace, bary, wellness, sportovní zařízení
   - **Services** - Room service, amenities, laundry, housekeeping, check-in/out
   - **Leisure** - Volnočasové aktivity
   - **Other** - Další obsah
   - **Welcome Message** - Uvítací zprávy
   - **Smart Assistant** - Chytrý asistent
   - **Legal Texts** - Právní texty

3. **My App** - Správa mobilní aplikace
4. **Activity** - Aktivity a logy
5. **CRM** - Správa vztahů se zákazníky
6. **Feedback** - Zpětná vazba od hostů
7. **Concierge** - Concierge služby
8. **Insights** - Analytika a statistiky

### Detailní funkce

#### Restaurants & Bars
- Seznam restaurací a barů s kartami
- Editace restaurace/baru s taby:
  - **Information** - Základní informace, obrázky, additional info, dress code
  - **Catalogs** - Produktové katalogy, měny, kategorie produktů
  - **Hours & booking system** - Otevírací doba, booking systém
  - **Upsell** - Upsell nabídky s obrázky
- Autosave funkcionalita
- Upload obrázků
- Modulární zapínání/vypínání funkcí

#### Modulární systém
- Každý modul může být zapnutý/vypnutý pomocí konfigurace
- Automatické skrytí neaktivních modulů v navigaci
- Ochrana routes - neaktivní moduly nejsou dostupné ani přes URL

---

## 🛠 Technologie

### Backend
- **Laravel 12** - PHP framework pro API a backend logiku
- **Supabase** - Backend-as-a-Service (PostgreSQL databáze)

### Frontend
- **React 19** - JavaScript knihovna pro stavbu uživatelských rozhraní
- **React Router 7** - Routing pro React SPA
- **Tailwind CSS 4** - Utility-first CSS framework
- **Alpine.js 3** - Lightweight JavaScript framework pro jednoduchou interaktivitu
- **Axios** - HTTP klient pro API volání
- **Vite** - Build tool a dev server

---

## 🏗 Architektura

### Obecná architektura

Aplikace používá **hybridní architekturu**:
- **Backend (Laravel)**: Poskytuje API endpointy a slouží jako entry point
- **Frontend (React SPA)**: Kompletní Single Page Application běžící v prohlížeči
- **Komunikace**: React komponenty komunikují s Laravel API pomocí Axios

### Flow aplikace

```
1. Uživatel otevře aplikaci
   ↓
2. Laravel vrátí app.blade.php (jediný Blade template)
   ↓
3. app.blade.php obsahuje <div id="react-root">
   ↓
4. resources/js/app.js inicializuje React aplikaci
   ↓
5. React Router zobrazí příslušnou stránku
   ↓
6. React komponenty volají Laravel API endpointy
   ↓
7. Laravel vrací JSON data
   ↓
8. React komponenty zobrazí data
```

### Struktura komunikace

```
┌─────────────┐         HTTP/JSON          ┌─────────────┐
│   React     │ ──────────────────────────> │   Laravel   │
│  Frontend   │ <────────────────────────── │    API      │
└─────────────┘                             └─────────────┘
     │                                              │
     │                                              │
     └─── Axios ───────────────────────────────────┘
```

---

## 📦 Instalace

### 1. Instalace závislostí

```bash
# PHP závislosti
composer install

# JavaScript závislosti
npm install
```

### 2. Nastavení prostředí

```bash
# Zkopírujte .env soubor
cp .env.example .env

# Vygenerujte aplikční klíč
php artisan key:generate
```

### 3. Konfigurace Supabase

Otevřete `.env` a nastavte:

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

### 4. Spuštění migrací

```bash
php artisan migrate
```

### 5. Vytvoření storage linku

```bash
php artisan storage:link
```

### 6. Spuštění vývojového serveru

```bash
# Terminal 1 - Laravel server
php artisan serve

# Terminal 2 - Vite dev server
npm run dev
```

Aplikace bude dostupná na `http://localhost:8000`

### 7. Build produkční verze

```bash
npm run build
```

---

## 📁 Struktura projektu

```
OtelApps-WebAdmin/
├── app/
│   └── Services/
│       └── ModuleService.php      # Služba pro správu modulů
│
├── config/
│   └── modules.php                # Konfigurace modulů (zapínání/vypínání)
│
├── database/
│   └── migrations/                # Databázové migrace
│
├── public/
│   ├── build/                     # Zkompilované assets (generováno Vite)
│   └── storage/                   # Symbolický link na storage/app/public
│
├── resources/
│   ├── css/
│   │   └── app.css                # Hlavní CSS soubor (Tailwind)
│   │
│   ├── js/
│   │   ├── app.js                 # Entry point - inicializuje React
│   │   ├── bootstrap.js            # Axios konfigurace
│   │   │
│   │   ├── components/            # React komponenty
│   │   │   ├── App.jsx             # Hlavní React aplikace s routingem
│   │   │   ├── Layout.jsx          # Layout wrapper (navigace, sidebar)
│   │   │   ├── MainNavigation.jsx # Horní navigační lišta
│   │   │   ├── Sidebar.jsx        # Boční menu
│   │   │   ├── FloatingHelp.jsx   # Floating chat tlačítko
│   │   │   ├── ProtectedRoute.jsx # Route ochrana
│   │   │   └── ErrorBoundary.jsx  # Error handling
│   │   │
│   │   └── pages/                 # React stránky
│   │       ├── main/              # Hlavní navigační stránky
│   │       │   ├── Dashboard.jsx
│   │       │   └── index.js
│   │       │
│   │       ├── content/           # Content management stránky
│   │       │   ├── Content.jsx
│   │       │   ├── Services.jsx
│   │       │   └── index.js
│   │       │
│   │       ├── modules/           # Dynamické modulární stránky
│   │       │   ├── facilities/
│   │       │   │   ├── RestaurantsBars.jsx
│   │       │   │   └── RestaurantEdit.jsx
│   │       │   ├── ModulePage.jsx
│   │       │   └── index.js
│   │       │
│   │       └── shared/            # Sdílené komponenty
│   │           ├── Page.jsx
│   │           ├── NotFound.jsx
│   │           └── index.js
│   │
│   └── views/
│       └── app.blade.php          # Jediný Blade template - vrací React SPA
│
├── routes/
│   └── web.php                    # Routes aplikace (API + catch-all pro React)
│
├── storage/
│   └── app/
│       └── public/
│           └── restaurants/      # Uploadované obrázky
│
├── .env                           # Environment proměnné
├── composer.json                  # PHP závislosti
├── package.json                   # JavaScript závislosti
└── vite.config.js                 # Vite konfigurace
```

---

## 🔄 Jak aplikace funguje

### 1. Inicializace

**Entry point: `resources/js/app.js`**

```javascript
// 1. Inicializuje Alpine.js pro jednoduchou interaktivitu
Alpine.start();

// 2. Inicializuje React aplikaci
const root = createRoot(document.getElementById('react-root'));
root.render(
    React.createElement(BrowserRouter, null, React.createElement(App))
);
```

### 2. Routing

**Hlavní routing: `resources/js/components/App.jsx`**

React Router definuje všechny routes aplikace:

```jsx
<Routes>
    <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="content" element={<ProtectedRoute><Content /></ProtectedRoute>} />
        <Route path="module/:type/:module" element={<ProtectedModuleRoute><ModulePage /></ProtectedModuleRoute>} />
        <Route path="*" element={<NotFound />} />
    </Route>
</Routes>
```

### 3. Layout a navigace

**Layout: `resources/js/components/Layout.jsx`**

- Obsahuje `MainNavigation` (horní navigace)
- Obsahuje `Sidebar` (boční menu)
- Obsahuje `<Outlet />` pro renderování aktuální stránky
- Spravuje backdrop pro modaly

### 4. Načítání modulů

**Sidebar: `resources/js/components/Sidebar.jsx`**

```javascript
// Načte moduly z API
axios.get('/api/modules/sidebar')
    .then(response => {
        setModules(response.data.modules);
    });
```

**Backend API: `routes/web.php`**

```php
Route::get('/api/modules/sidebar', function () {
    $sidebarModules = ModuleService::getSidebarModules();
    // Vrací JSON s moduly
});
```

### 5. Ochrana routes

**ProtectedRoute: `resources/js/components/ProtectedRoute.jsx`**

- Kontroluje, zda je modul zapnutý
- Pokud není, přesměruje na `/dashboard` nebo zobrazí `NotFound`

### 6. Komunikace s API

**Příklad: Načtení dat**

```javascript
// V React komponentě
useEffect(() => {
    axios.get('/api/restaurants')
        .then(response => {
            setData(response.data);
        });
}, []);
```

---

## 🧩 Modulární systém

### Konfigurace modulů

**Soubor: `config/modules.php`**

```php
return [
    'enabled' => [
        'dashboard' => true,
        'content' => true,
        'services' => true,
        // ...
    ],
    
    'labels' => [
        'dashboard' => 'Dashboard',
        'services' => 'Services',
        // ...
    ],
    
    'icons' => [
        'dashboard' => 'home',
        'services' => 'bell',
        // ...
    ],
];
```

### ModuleService

**Soubor: `app/Services/ModuleService.php`**

Poskytuje metody pro práci s moduly:

```php
// Zkontroluje, zda je modul zapnutý
ModuleService::isEnabled('dashboard'); // true/false

// Získá název modulu
ModuleService::getLabel('dashboard'); // 'Dashboard'

// Získá ikonu modulu
ModuleService::getIcon('dashboard'); // 'home'

// Získá moduly pro hlavní navigaci
ModuleService::getMainNavigation(); // ['dashboard', 'content', ...]

// Získá moduly pro sidebar
ModuleService::getSidebarModules(); // ['facilities' => [...], 'services', ...]
```

### Zapínání/vypínání modulů

1. Otevřete `config/modules.php`
2. Změňte hodnotu z `true` na `false`:

```php
'enabled' => [
    'crm' => false,  // Vypne CRM sekci
],
```

3. Vyčistěte cache:

```bash
php artisan config:clear
```

4. Modul zmizí z navigace a nebude dostupný ani přes URL

---

## ➕ Přidávání nových komponent

### Krok 1: Přidání do konfigurace

**Soubor: `config/modules.php`**

```php
'enabled' => [
    // Přidejte nový modul
    'my_new_module' => true,
],

'labels' => [
    // Přidejte název
    'my_new_module' => 'My New Module',
],

'icons' => [
    // Přidejte ikonu (Heroicons název)
    'my_new_module' => 'star',
],
```

### Krok 2: Vytvoření React komponenty

**Kde vytvořit komponentu?**

- **Hlavní navigační stránka** → `resources/js/pages/main/MyNewModule.jsx`
- **Content stránka** → `resources/js/pages/content/MyNewModule.jsx`
- **Modulární stránka** → `resources/js/pages/modules/MyNewModule.jsx`
- **Sdílená komponenta** → `resources/js/pages/shared/MyNewModule.jsx`

**Příklad: Hlavní navigační stránka**

```jsx
// resources/js/pages/main/MyNewModule.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NotFound } from '../shared/NotFound';

export function MyNewModule() {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    // Kontrola, zda je modul zapnutý
    useEffect(() => {
        axios.get('/api/modules/check/my_new_module')
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, []);

    // Načtení dat z API
    useEffect(() => {
        if (isEnabled) {
            axios.get('/api/my-new-module/data')
                .then(response => {
                    setData(response.data);
                })
                .catch(error => {
                    console.error('Error loading data:', error);
                });
        }
    }, [isEnabled]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!isEnabled) {
        return <NotFound />;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                My New Module
            </h1>
            
            {/* Váš obsah */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                {data.map(item => (
                    <div key={item.id}>{item.name}</div>
                ))}
            </div>
        </div>
    );
}
```

**Příklad: Modulární stránka s sub-moduly**

```jsx
// resources/js/pages/modules/services/RoomService.jsx
import React, { useState } from 'react';

export function RoomService() {
    const [items, setItems] = useState([]);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Room Service
            </h1>
            {/* Váš obsah */}
        </div>
    );
}
```

### Krok 3: Přidání route

**Soubor: `resources/js/components/App.jsx`**

```jsx
import { MyNewModule } from '../pages/main/MyNewModule';
import { ProtectedRoute } from './ProtectedRoute';

// V Routes
<Route 
    path="my_new_module" 
    element={
        <ProtectedRoute moduleName="my_new_module">
            <MyNewModule />
        </ProtectedRoute>
    } 
/>
```

**Pro modulární stránku:**

```jsx
import { RoomService } from '../pages/modules/services/RoomService';

// V ModulePage.jsx nebo App.jsx
if (type === 'services' && module === 'room_service') {
    return <RoomService />;
}
```

### Krok 4: Přidání do navigace

**Pro hlavní navigaci: `app/Services/ModuleService.php`**

```php
public static function getMainNavigation(): array
{
    $mainModules = [
        'dashboard', 
        'content', 
        'my_app', 
        'my_new_module',  // Přidejte sem
        'activity', 
        // ...
    ];
    
    return array_filter($mainModules, function($module) {
        return self::isEnabled($module);
    });
}
```

**Pro sidebar: `app/Services/ModuleService.php`**

```php
public static function getSidebarModules(): array
{
    $sidebarModules = [
        'facilities' => [...],
        'services' => [
            'room_service',
            'my_new_service',  // Přidejte sem
            // ...
        ],
        'my_new_module',  // Nebo jako samostatný modul
        // ...
    ];
    
    // ... zbytek kódu
}
```

### Krok 5: Vytvoření API endpointu (pokud potřebujete data)

**Soubor: `routes/web.php`**

```php
Route::prefix('api')->group(function () {
    // Endpoint pro načtení dat
    Route::get('/my-new-module/data', function () {
        // Zde načtěte data z databáze nebo jiného zdroje
        return response()->json([
            'data' => [
                ['id' => 1, 'name' => 'Item 1'],
                ['id' => 2, 'name' => 'Item 2'],
            ]
        ]);
    });
    
    // Endpoint pro uložení dat
    Route::post('/my-new-module/save', function (Request $request) {
        // Zde uložte data
        $data = $request->input('data');
        
        // Uložení do databáze
        // ...
        
        return response()->json([
            'success' => true,
            'message' => 'Data saved successfully',
        ]);
    });
});
```

### Krok 6: Export komponenty (volitelné)

**Soubor: `resources/js/pages/main/index.js`**

```jsx
export { Dashboard } from './Dashboard';
export { MyNewModule } from './MyNewModule';  // Přidejte
```

### Krok 7: Build

```bash
npm run build
```

---

## 📝 Detailní příklady přidání komponent

### Příklad 1: Přidání hlavní navigační stránky

**Cíl:** Přidat stránku "Reports" do hlavní navigace

**1. Konfigurace: `config/modules.php`**

```php
'enabled' => [
    'reports' => true,  // Přidejte
],

'labels' => [
    'reports' => 'Reports',  // Přidejte
],

'icons' => [
    'reports' => 'chart-bar',  // Přidejte
],
```

**2. Vytvoření komponenty: `resources/js/pages/main/Reports.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NotFound } from '../shared/NotFound';

export function Reports() {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);

    useEffect(() => {
        axios.get('/api/modules/check/reports')
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (isEnabled) {
            axios.get('/api/reports')
                .then(response => {
                    setReports(response.data);
                });
        }
    }, [isEnabled]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (!isEnabled) {
        return <NotFound />;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(report => (
                    <div key={report.id} className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold mb-2">{report.title}</h2>
                        <p className="text-gray-600">{report.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

**3. Přidání route: `resources/js/components/App.jsx`**

```jsx
import { Reports } from '../pages/main/Reports';

// V Routes
<Route 
    path="reports" 
    element={
        <ProtectedRoute moduleName="reports">
            <Reports />
        </ProtectedRoute>
    } 
/>
```

**4. Přidání do navigace: `app/Services/ModuleService.php`**

```php
public static function getMainNavigation(): array
{
    $mainModules = [
        'dashboard', 
        'content', 
        'my_app', 
        'activity', 
        'crm', 
        'feedback', 
        'concierge', 
        'insights',
        'reports',  // Přidejte sem
    ];
    
    return array_filter($mainModules, function($module) {
        return self::isEnabled($module);
    });
}
```

**5. API endpoint: `routes/web.php`**

```php
Route::prefix('api')->group(function () {
    Route::get('/reports', function () {
        return response()->json([
            ['id' => 1, 'title' => 'Monthly Report', 'description' => '...'],
            ['id' => 2, 'title' => 'Weekly Report', 'description' => '...'],
        ]);
    });
});
```

**6. Build:**

```bash
npm run build
```

### Příklad 2: Přidání modulární stránky s editací

**Cíl:** Přidat editaci pro "Room Service" v sekci Services

**1. Konfigurace: `config/modules.php`**

```php
'enabled' => [
    'room_service' => true,  // Už je přidáno
],

'labels' => [
    'room_service' => 'Room service',  // Už je přidáno
],
```

**2. Vytvoření komponenty: `resources/js/pages/modules/services/RoomService.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export function RoomService() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/room-service/items')
            .then(response => {
                setItems(response.data);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Room Service</h1>
                <button
                    onClick={() => navigate('/module/services/room_service/new')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                    + ADD ITEM
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="font-semibold mb-2">{item.name}</h3>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

**3. Přidání do ModulePage: `resources/js/pages/modules/ModulePage.jsx`**

```jsx
import { RoomService } from './services/RoomService';

// V komponentě
if (type === 'services' && module === 'room_service') {
    return <RoomService />;
}
```

**4. API endpoint: `routes/web.php`**

```php
Route::prefix('api')->group(function () {
    Route::get('/room-service/items', function () {
        return response()->json([
            ['id' => 1, 'name' => 'Breakfast', 'description' => '...'],
            ['id' => 2, 'name' => 'Lunch', 'description' => '...'],
        ]);
    });
});
```

### Příklad 3: Přidání sdílené komponenty

**Cíl:** Vytvořit sdílenou komponentu pro zobrazení karet

**1. Vytvoření komponenty: `resources/js/components/Card.jsx`**

```jsx
import React from 'react';

export function Card({ title, description, image, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        >
            {image && (
                <img 
                    src={image} 
                    alt={title}
                    className="w-full h-48 object-cover"
                />
            )}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                {description && (
                    <p className="text-gray-600 text-sm">{description}</p>
                )}
            </div>
        </div>
    );
}
```

**2. Použití komponenty:**

```jsx
import { Card } from '../components/Card';

export function MyPage() {
    return (
        <div className="grid grid-cols-3 gap-6">
            <Card
                title="Restaurant"
                description="Fine dining experience"
                image="/images/restaurant.jpg"
                onClick={() => console.log('Clicked')}
            />
        </div>
    );
}
```

---

## 🔌 API a Backend

### API Endpointy

**Soubor: `routes/web.php`**

#### Moduly

```php
// Zkontroluje, zda je modul zapnutý
GET /api/modules/check/{module}
Response: { "enabled": true }

// Zkontroluje, zda je sub-modul zapnutý
GET /api/modules/check/{type}/{module}
Response: { "enabled": true }

// Získá moduly pro hlavní navigaci
GET /api/modules/main-navigation
Response: { "modules": [...], "labels": {...} }

// Získá moduly pro sidebar
GET /api/modules/sidebar
Response: { "modules": [...] }
```

#### Restaurants & Bars

```php
// Uložení dat restaurace
POST /api/restaurants/{id}/save
Body: { "data": "..." }
Response: { "success": true }

// Upload obrázku
POST /api/restaurants/{id}/upload-image
Body: FormData (image, image_id)
Response: { "success": true, "url": "..." }
```

### Vytvoření nového API endpointu

**Příklad: Endpoint pro načtení dat**

```php
// routes/web.php
Route::prefix('api')->group(function () {
    Route::get('/my-endpoint', function () {
        // Načtení dat z databáze
        $data = DB::table('my_table')->get();
        
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    });
    
    Route::post('/my-endpoint', function (Request $request) {
        // Validace
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
        ]);
        
        // Uložení do databáze
        $id = DB::table('my_table')->insertGetId($validated);
        
        return response()->json([
            'success' => true,
            'id' => $id,
        ]);
    });
});
```

**Použití v React komponentě:**

```jsx
// Načtení dat
useEffect(() => {
    axios.get('/api/my-endpoint')
        .then(response => {
            setData(response.data.data);
        });
}, []);

// Uložení dat
const handleSave = () => {
    axios.post('/api/my-endpoint', {
        name: 'John',
        email: 'john@example.com',
    })
    .then(response => {
        console.log('Saved:', response.data);
    });
};
```

### Práce s databází

**Eloquent modely:**

```php
// app/Models/Restaurant.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    protected $fillable = ['name', 'description', 'image_url'];
}
```

**Použití:**

```php
// routes/web.php
use App\Models\Restaurant;

Route::get('/api/restaurants', function () {
    $restaurants = Restaurant::all();
    return response()->json($restaurants);
});
```

---

## 🎨 Styling

### Tailwind CSS

Aplikace používá **Tailwind CSS 4** pro styling.

**Základní použití:**

```jsx
<div className="p-6 bg-white rounded-lg shadow-sm">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Title</h1>
    <p className="text-gray-600">Description</p>
</div>
```

**Responsive design:**

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Content */}
</div>
```

**Dark mode:**

```jsx
<div className="bg-white dark:bg-gray-800">
    <p className="text-gray-900 dark:text-white">Text</p>
</div>
```

### Vlastní styly

**Soubor: `resources/css/app.css`**

```css
@import 'tailwindcss';

/* Vlastní styly */
.custom-button {
    @apply px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600;
}
```

**Použití:**

```jsx
<button className="custom-button">Click me</button>
```

---

## 🚀 Vývoj

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
php artisan route:clear

# Optimalizace
php artisan optimize
```

### Debugging

**React DevTools:**
- Nainstalujte React DevTools extension v prohlížeči
- Otevřete Developer Tools → React tab

**Laravel Debugging:**
- Použijte `dd()` nebo `dump()` v PHP kódu
- Zkontrolujte Laravel logy v `storage/logs/laravel.log`

---

## 📚 Best Practices

### React komponenty

1. **Používejte funkční komponenty s hooks**
2. **Dělte komponenty na menší části**
3. **Používejte `useEffect` pro side effects**
4. **Kontrolujte, zda je modul zapnutý před zobrazením**

### API volání

1. **Vždy ošetřujte chyby**
2. **Používejte loading states**
3. **Validujte data před odesláním**

### Styling

1. **Používejte Tailwind utility třídy**
2. **Respektujte design systém (oranžová barva pro akce)**
3. **Používejte responsive třídy**

### Modulární systém

1. **Vždy přidejte modul do konfigurace**
2. **Používejte `ProtectedRoute` pro ochranu**
3. **Kontrolujte `isEnabled` před zobrazením**

---

## 🐛 Řešení problémů

### Prázdná obrazovka

1. Zkontrolujte konzoli prohlížeče (F12)
2. Zkontrolujte, zda je `#react-root` v DOM
3. Spusťte `npm run build`

### Modul se nezobrazuje v navigaci

1. Zkontrolujte `config/modules.php` - je modul zapnutý?
2. Vyčistěte cache: `php artisan config:clear`
3. Zkontrolujte API endpoint `/api/modules/main-navigation`

### API volání selhávají

1. Zkontrolujte Network tab v Developer Tools
2. Zkontrolujte Laravel logy
3. Ověřte, zda je route správně definována

---

## 📖 Dokumentace

- [Laravel Dokumentace](https://laravel.com/docs)
- [React Dokumentace](https://react.dev/)
- [React Router Dokumentace](https://reactrouter.com/)
- [Tailwind CSS Dokumentace](https://tailwindcss.com/docs)
- [Alpine.js Dokumentace](https://alpinejs.dev/)
- [Supabase Dokumentace](https://supabase.com/docs)
- [Axios Dokumentace](https://axios-http.com/docs/intro)

---

## 📞 Podpora

Pro otázky a problémy kontaktujte vývojový tým.

---

**Verze:** 1.0.0  
**Poslední aktualizace:** 2024
