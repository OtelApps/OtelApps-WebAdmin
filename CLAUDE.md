# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Co je to za projekt

Laravel 12 + React 19 hybridní webová administrace pro hotelovou mobilní aplikaci (OtelApps). Laravel slouží jako
API backend a jako entry point (jediný Blade view), veškerý UI běží jako React SPA. Hotelová doménová data
(restaurace, wellness, room service, CRM, concierge chat, …) žijí v **Supabase Postgres**, ne v lokální Laravel
databázi.

## Vývojové příkazy

```bash
composer install && npm install         # instalace závislostí
cp .env.example .env && php artisan key:generate

# Spuštění celého devu najednou (server + queue worker + logy + vite) — preferovaný způsob:
composer dev

# nebo jednotlivě:
php artisan serve
php artisan queue:listen --tries=1      # nutné pro concierge afterResponse joby
npm run dev                             # Vite dev server

npm run build                           # produkční build assetů
```

Testy:
```bash
composer test                           # config:clear + php artisan test
php artisan test --filter=TestName      # jeden test
php artisan test tests/Feature/SomeTest.php
```

Cache/config po změně `config/*.php` nebo `.env`:
```bash
php artisan config:clear
```

Frontend nemá lint/test skripty nastavené v `package.json` — jen `build`, `dev`, `watch`.

## Dvě databáze — nepliesti si je

- **Výchozí Laravel DB** (`DB_CONNECTION`, default `sqlite`) — jen framework věci: `users`, `sessions`, `cache`,
  `jobs`. Migrace v `database/migrations/`.
- **`supabase` connection** (`config/database.php`, env `SUPABASE_DB_*`) — veškerá hotelová doménová data. Schéma
  se nespravuje Laravel migracemi, ale ručně psanými SQL soubory v `database/supabase/*.sql` (spouští se přímo
  v Supabase SQL editoru).
- Který connection použít v runtime řídí `config('otelapps.db_connection')` (env `OTELAPPS_DB_CONNECTION`,
  default `supabase`). Modely nad hotelovými daty (`HotelCrmGuestProfile`, `HotelConciergeConversation`, …) si
  nastavují `$this->connection = config('otelapps.db_connection')` v konstruktoru — **nepoužívej `protected $connection = 'supabase'` natvrdo**, kopíruj vzor z existujícího modelu.
- Supabase transaction pooler (port 6543) nepodporuje server-side prepared statements → `PostgresConnection` je
  nahrazená `App\Database\PostgresEmulatedConnection` (registrováno v `AppServiceProvider`), která vynucuje
  `PDO::ATTR_EMULATE_PREPARES` a posílá bool bindings jako `'true'/'false'` stringy místo `0/1` (jinak padá
  `boolean = integer`). Při debugování divných SQL chyb z Postgres (`SQLSTATE[26000]`, `SQLSTATE[08P01]`,
  „boolean = integer“, „prepared statement“) je to první podezřelé místo.
- Modely s UUID PK (`$incrementing = false`, `$keyType = 'string'`) používají trait `HasUuidPrimaryKey`
  (`app/Models/Concerns/HasUuidPrimaryKey.php`), který nastaví UUID před insertem přes `eloquent.creating` event —
  bez toho zůstanou FK sloupce null, protože Eloquent nezná DB-generated hodnotu při insertu.

## Modulární systém (feature flags)

- `config/modules.php` je jediný zdroj pravdy pro to, co je v aplikaci zapnuté (`enabled`), jak se to jmenuje
  (`labels`) a jaká má ikonu (`icons`). Klíče jsou ploché stringy (`restaurants_bars`, `crm`, `surveys_checkout`, …).
- `App\Services\ModuleService` drží statickou hierarchickou mapu `$sidebarMap` (sekce → moduly → submoduly) a
  poskytuje `isEnabled()`, `resolveSection()`, `getSidebarModules()`, `getClientBootstrap()`.
- Vypnutý modul: zmizí z hlavní navigace i ze sidebaru A route na frontendu ho odmítne (ne jen skrytí v UI).
- **Bootstrap bez round-tripu**: `ModuleService::getClientBootstrap()` se serializuje přímo do
  `resources/views/app.blade.php` jako `window.__OTELAPPS_BOOTSTRAP__` (viz `@json(...)` v blade). React čte tuhle
  globální proměnnou přes `ModulesContext` (`resources/js/context/ModulesContext.jsx`) — **žádný fetch při startu
  aplikace**. `/api/modules/*` endpointy v `routes/web.php` existují pro dílčí re-fetch (např. po přepnutí sekce
  v sidebaru), ne pro initial load.
- Přidání nového modulu = úprava `config/modules.php` (`enabled`/`labels`/`icons`) + případně `$sidebarMap` v
  `ModuleService` pro zařazení do hierarchie + routing na frontendu (viz níže).

## Frontend routing — dva vzory stránek

1. **Pojmenované top-level route** v `resources/js/components/layout/App.jsx` (recepce, ukoly, finance,
   dashboard, content, activity, crm, feedback, concierge, insights) — každá obalená
   `<ProtectedRoute moduleName="...">`.
2. **Generický dynamický vzor** `module/:type/:module` (a `/:area`, `/:id/edit` varianty) obalený
   `ProtectedModuleRoute`, který renderuje `DynamicModulePage` / `DynamicEditRouter`
   (`resources/js/pages/shared/`). Tyto komponenty mapují `(type, module)` param páry na konkrétní React
   komponentu přes ploché lookup objekty (`FACILITIES_PAGES`, `SERVICES_PAGES`, `OTHER_PAGES`, finance_*,
   switch pro surveys, …). Nová facility/service/content stránka se zapojuje přidáním do jednoho z těchto
   mapování, ne přidáním nové `<Route>`.
- `ProtectedRoute` / `ProtectedModuleRoute` (`resources/js/components/ui/ProtectedRoute.jsx`) čtou stav z
  `ModulesContext`, ne z API — kontrola je synchronní.
- Všechny mutace i GET požadavky z Reactu jdou přes sdílený klient `resources/js/lib/http.js` (`withCredentials`,
  automatický CSRF header + retry na 419), **nikdy přímo přes `axios`**.
- Data fetching přes TanStack Query — společný `queryClient` v `resources/js/lib/queryClient.js`, hook
  `useHttpQuery` (`resources/js/hooks/useHttpQuery.js`) obaluje `http` klienta.

## Backend struktura API

- `routes/web.php` — všechny API routy pod `Route::prefix('api')`, na konci catch-all `/{any}` vracející
  `view('app')` pro React Router (musí zůstat **za** API skupinou). Řadič vs. inline closure: jednoduché
  module-check endpointy jsou inline closures, doménová logika jde přes `Api\*Controller` → `*Service`.
- Vzor napříč doménovými controllery (`VenueController`, `WellnessController`, `HotelRoomServiceController`, …):
  identifikace přes `slug`, ne numerické ID; samostatné `PUT` endpointy pro pod-zdroje (`/hours`, `/catalog`,
  `/images`, `/menus`, `/features`) místo jednoho velkého update. Následuj tenhle vzor u nových content modulů.
- Business logika žije v `app/Services/*Service.php`, controllery zůstávají tenké.

## Concierge AI (nejsložitější subsystém)

- `App\Services\ConciergeBotService` řídí stavový automat konverzace uložený v `HotelConciergeConversation.metadata['mode']`:
  `bot` (AI odpovídá) → `waiting` (host chce recepci, čeká na převzetí) → `staff` (recepce aktivně řeší).
  Přechody: `escalateToStaff()`, `takeOverByStaff()`, `releaseToBot()`.
- `App\Services\OpenAiService` je tenký klient nad OpenAI-kompatibilním API — v produkci/lokálně se často míří na
  **LM Studio** (`OPENAI_BASE_URL=http://127.0.0.1:1234/v1`), ne na cloud OpenAI. Kód proto musí počítat s tím, že
  model neumí `response_format=json_object` (`OPENAI_JSON_MODE=false`) a JSON se vynucuje promptem +
  `tryDecodeJson()` s textovým fallbackem.
- Odpovědi bota se vždy generují ve dvou jazykových verzích: `body` (čeština pro staff) a `body_translated`
  (jazyk hosta) — viz `normalizeBotReplies()`. Host i recepce vidí jen tu verzi, která je pro ně.
- Zprávy hosta se zpracovávají mimo hlavní HTTP request: `ProcessConciergeGuestMessage::dispatchAfterHttpResponse()`
  se pokusí nejdřív spawnout samostatný `php artisan concierge:process` proces (`exec` + `nohup`), a teprve pokud
  to nejde, fallbackne na `dispatch(...)->afterResponse()` v rámci `php artisan serve` workeru. Důvod: LLM +
  1-2 překlady snadno přesáhnou běžný request timeout a blokovaly by `serve` pro další requesty.
- Idempotence a race podmínky se řeší přes `Cache::lock('concierge-reply:'.$message->id, ...)` a `hasReplyAfter()`
  kontroly — při úpravách téhle služby dávej pozor, aby dvojité zpracování stejné guest zprávy nevytvořilo
  duplicitní bot odpověď.
- Systémové zprávy (escalace, satisfaction check, poznámky jen pro hosta/jen pro staff) se rozlišují markerem v
  `staff_display_name` (`GUEST_ONLY_NOTICE_MARKER`, `STAFF_ONLY_NOTICE_MARKER`, `SATISFACTION_CHECK_MARKER`), ne
  samostatným sloupcem — respektuj tenhle vzor při přidávání nových typů systémových zpráv.
- Guest push notifikace (Expo) jdou přes `GuestPushService`/`ExpoPushService`/`GuestPushAudienceResolver`; SQL
  schéma v `database/supabase/hotel_guest_push_tokens.sql`, přehled endpointů v `PUSH_SETUP.md`.

## Finance (noční uzávěrka)

- Top-level modul `finance` + sidebar (`finance_overview`, `finance_closings`, `finance_transactions`,
  `finance_deposits`, `finance_reports`).
- SoT plateb: `hotel_payments` (+ metody/terminály); uzávěrky: `hotel_financial_closings` + lines / cash counts /
  deposits / events. SQL: `database/supabase/hotel_finance_closings.sql`.
- Business logika: `FinancialClosingService` (+ preflight, reconciliation, cash count, audit). FE jen prezentuje.
- Po `complete` je uzávěrka LOCKED s immutable JSON `snapshot` — historické reporty se nepřepočítávají z live DB.
- Config: `config/otelapps.php` → `finance`; hotel override `hotel_finance_settings`.

## Ostatní konvence

- `config_array()` (`app/helpers.php`) — vždy použij místo `config()`, když očekáváš pole (bezpečné pro statickou
  analýzu a `array_keys`/`array_filter`).
- Čeština je primární jazyk komentářů, commit zpráv a uživatelsky viditelných textů v adminu; anglicky se píšou
  hlavně LLM prompty pro Concierge bota (protože musí fungovat napříč jazyky hosta).
- Aktuální přehled modulů a setupu: `README.md`. Konkrétní zapnutí vždy ověř proti `config/modules.php` a
  `routes/web.php`.
