# OtelApps WebAdmin

Laravel 12 + React 19 hybridní webová administrace pro hotelovou mobilní aplikaci [OtelApps](../OtelApps).  
Laravel slouží jako API backend a entry point (jeden Blade view); UI je React SPA. Hotelová doménová data žijí v **Supabase Postgres**, ne v lokální Laravel databázi.

Pro AI / hlubší konvence viz [`CLAUDE.md`](CLAUDE.md). Push notifikace: [`PUSH_SETUP.md`](PUSH_SETUP.md).

## Co aplikace umí

| Sekce | Popis |
|--------|--------|
| **Recepce** | Board pokojů, pobyty, folio, minibar, historie |
| **Úkoly** | Provozní tikety (úklid, donáška, údržba, …) |
| **Finance** | Noční finanční uzávěrka, platební ledger, odvody, reporty |
| **Dashboard** | Přehledové widgety |
| **Content** | Facilities, services, hotel info, menus, … |
| **Activity** | Požadavky hostů ze service requests |
| **CRM** | Hosté, alerts, promotions, tasks |
| **Feedback** | Survey + inbox |
| **Concierge** | Chat host ↔ recepce (+ AI bot) |
| **Insights** | Analytika (users / transactions / revenue / behavior) |

### Finance — noční uzávěrka

Wizard pro recepci: preflight → pokladna (expected vs actual) → odvody → lock + immutable snapshot.

- UI: `/finance`, `/finance/closings/:id`, sidebar Přehled / Uzávěrky / Transakce / Odvody / Reporty
- API: `/api/finance/*` (`FinancialClosingController` → `FinancialClosingService`)
- Schéma + seed: [`database/supabase/hotel_finance_closings.sql`](database/supabase/hotel_finance_closings.sql)
- Permissions: `modules.finance.view`, `finance.closing.*`, `finance.reports.*`
- Config defaults: `config/otelapps.php` → `finance` (`financial_day_start_time`, cash float, variance limity)

## Technologie

- **Backend:** Laravel 12, session auth (staff SPA) + Sanctum token (HQ platform API), RBAC (user types + permissions)
- **DB:** Laravel default (sqlite/mysql) pro `users` / sessions / jobs; **Supabase Postgres** pro hotelovou doménu
- **Frontend:** React 19, React Router 7, TanStack Query 5, Tailwind CSS 4, Vite 7
- **HTTP:** sdílený klient `resources/js/lib/http.js` (ne raw axios) + `useHttpQuery`

## Rychlý start

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate

# Laravel DB (users, sessions, …)
php artisan migrate
php artisan db:seed --class=AuthDemoSeeder   # demo uživatelé + permissions

# Preferovaný all-in-one dev (serve + queue + vite + logy):
composer dev

# nebo zvlášť:
php artisan serve
php artisan queue:listen --tries=1   # Concierge afterResponse joby
npm run dev
```

Aplikace: `http://127.0.0.1:8000/h/{OTELAPPS_HOTEL_SLUG}/` (redirect z `/` na `/h/{slug}/`)

Demo loginy (heslo `password`): `superadmin@otelapps.test`, `recepce@otelapps.test`, `manazer@otelapps.test`, …

### Supabase

V `.env` nastavte `SUPABASE_DB_*` a `OTELAPPS_DB_CONNECTION=supabase` (viz `.env.example`).

Schéma hotelové domény **není** v Laravel migracích — SQL soubory ve `database/supabase/` se spouští v Supabase SQL editoru, např.:

- `hotel_reception.sql` — pokoje, pobyty, folio
- `hotel_ops_tickets.sql` — fronty tiketů
- `hotel_finance_closings.sql` — platby + uzávěrky
- `hotel_guest_push_tokens.sql` — guest push
- `hotel_module_settings.sql` — per-hotel zapnutí modulů
- `hotel_profiles.sql` — branding, URL, geo (HQ)
- `hotel_slug_scope.sql` — unique `(hotel_id, slug)` na content tabulkách

Po změně `config/*.php` nebo `.env`:

```bash
php artisan config:clear
```

### Testy

```bash
composer test
php artisan test --filter=FinancialClosingTest
php artisan test --filter=MoneyTest
php artisan test --filter=HotelModulesTest
php artisan test --filter=PlatformApiTest
```

## Hotel a moduly

Jedna codebase + jedna Supabase, každý zákazník má řádek v `hotels` (`slug`), overlay v `hotel_module_settings` a profil v `hotel_profiles`. Defaultní identita nasazení: `OTELAPPS_HOTEL_SLUG`. Superadmin (a HQ) může otevřít jiný hotel na **`/h/{slug}/…`**; request posílá `X-Hotel-Slug`. Staff bez superadmina zůstane na env slugu.

Defaulty jsou v `config/modules.php`. Per-hotel overlay v DB **přepisuje jen uvedené klíče**; chybějící klíč padá na config. Admin SPA dostane mapu v `window.__OTELAPPS_BOOTSTRAP__` (včetně `hotelSlug`). Guest appky berou config z:

`GET /api/public/hotel/{slug}/config` → `{ slug, name, app_name, modules, geo, stores }`

Staff úprava: `GET/PUT /api/hotel/modules` (session). HQ: `/api/platform/*` (Sanctum, jen superadmin). Vypnutý `concierge` (nebo `concierge_chat`) na guest concierge API vrací **403**.

### YAML profil zákazníka

Šablona / export: [`customers/_example.yml`](customers/_example.yml). **Zdroj pravdy je DB** (`hotels` + `hotel_profiles` + `hotel_module_settings`), ne YAML. Tajnosti do YAML nepatří.

```bash
# Vytvoří/aktualizuje hotel, profil i moduly
php artisan hotel:provision customers/grand-hotel.yml

# Env šablony bez secretů (webadmin.env / hostweb.env / mobile.env)
php artisan hotel:env-files customers/grand-hotel.yml

# Ruční overlay
php artisan hotel:modules grand-hotel
php artisan hotel:modules grand-hotel --enable=recepce,concierge --disable=insights
```

SQL: [`database/supabase/hotel_profiles.sql`](database/supabase/hotel_profiles.sql) (spusť v Supabase). CORS pro HQ a HostWeb: `CORS_ALLOWED_ORIGINS` (localhost:5173 HostWeb, :5174 HQ).

Control plane: [OtelApps-HQ](../OtelApps-HQ) (Netlify SPA → `POST /api/platform/login`).

Vypnutí `concierge` schová staff i host chat. Kill-switch na guest appkách: bez úspěšného configu se nenačtou; vypnutý modul nejde otevřít routou. RLS v Postgresu to neřeší — je to produktový gate.

## Architektura (stručně)

```
Prohlížeč (React SPA)
    │  http.js + TanStack Query
    ▼
Laravel /api/*  →  Api\*Controller  →  *Service
    │
    ├─ default DB     users, sessions, permissions, jobs
    └─ supabase DB    hotels, payments, closings, folio, concierge, …
```

- Bootstrap modulů a uživatele jde do SPA bez round-tripu: `window.__OTELAPPS_BOOTSTRAP__` v `app.blade.php` (zdroj `ModuleService::getClientBootstrap()` = `config/modules.php` + overlay hotelu).
- Feature flags: `config/modules.php` (defaulty) + `hotel_module_settings` + `ModuleService` (`enabledMap`, `$sidebarMap`, main nav).
- RBAC: `config/permissions.php` → tabulky `permissions` / `user_types`; frontend `AuthContext.hasPermission` / `canAccessModule`.

### Routing (frontend)

1. Top-level: `resources/js/components/layout/App.jsx` + `<ProtectedRoute moduleName="…">`  
   (recepce, ukoly, finance, dashboard, …)
2. Dynamické: `/module/:type/:module` → `DynamicModulePage` (content, insights, finance_* subpages, CRM, …)

### Klíčové cesty

```
app/Http/Controllers/Api/     # tenké controllery
app/Services/                 # business logika
app/Models/                   # Eloquent (hotelové = otelapps.db_connection)
config/modules.php
config/permissions.php
config/otelapps.php
customers/_example.yml          # YAML profil zákazníka
database/supabase/*.sql
resources/js/components/layout/App.jsx
resources/js/pages/finance/   # uzávěrka wizard
resources/js/lib/http.js
routes/web.php                # API + SPA catch-all
```

## Přidání nového top-level modulu

1. `config/modules.php` — `enabled` / `labels` / `icons`
2. `ModuleService::getMainNavigation()` (+ případně `$sidebarMap`)
3. `config/permissions.php` — `modules.<key>.view` (+ akce); seed / User Admin
4. Route v `App.jsx` + stránka v `resources/js/pages/…`
5. Ikona v `MainNavigation.jsx`
6. API v `routes/web.php` → Controller → Service
7. Doménové tabulky: nový `database/supabase/*.sql` (ne Laravel migrace)
8. Guest appky: stejný klíč v HostWeb `ModuleRoute` a mobil `SCREEN_MODULES` (jinak se modul neschová / neuzavře)

Content submodul: stačí mapování v `DynamicModulePage` + `modules.php` + sidebar mapa.

## Finance — checklist po pullu

1. Spustit SQL [`database/supabase/hotel_finance_closings.sql`](database/supabase/hotel_finance_closings.sql) v Supabase  
2. `php artisan db:seed --class=AuthDemoSeeder`  
3. `php artisan config:clear`  
4. Otevřít **Finance** → Zahájit uzávěrku (jako recepce / manažer)

## Dokumentace

- [Laravel](https://laravel.com/docs) · [React](https://react.dev/) · [React Router](https://reactrouter.com/) · [TanStack Query](https://tanstack.com/query) · [Tailwind](https://tailwindcss.com/docs) · [Supabase](https://supabase.com/docs)

---

**Poslední aktualizace:** září 2026
