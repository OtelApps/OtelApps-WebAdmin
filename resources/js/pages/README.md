# Struktura Pages

Tento adresář obsahuje všechny React stránky aplikace, organizované do logických složek.

## Struktura

```
pages/
├── main/           # Hlavní navigační stránky (top bar)
│   ├── Dashboard.jsx
│   ├── Activity.jsx
│   ├── Crm.jsx
│   ├── Feedback.jsx
│   ├── Concierge.jsx
│   ├── Insights.jsx
│   └── MyApp.jsx
│
├── content/        # Content management stránky
│   ├── Content.jsx
│   ├── Facilities.jsx
│   ├── Services.jsx
│   ├── Leisure.jsx
│   ├── WelcomeMessage.jsx
│   ├── SmartAssistant.jsx
│   └── LegalTexts.jsx
│
├── modules/        # Dynamické modulární stránky
│   ├── ModulePage.jsx
│   └── facilities/
│       ├── RestaurantsBars.jsx
│       ├── WellnessSpa.jsx
│       ├── Sports.jsx
│       └── OtherFacilities.jsx
│
└── shared/         # Sdílené komponenty a utility stránky
    ├── Page.jsx
    ├── NotFound.jsx
    ├── Loading.jsx
    └── ErrorPage.jsx
```

## Kde přidat novou stránku?

### Hlavní navigační stránka (top bar)
Vytvořte soubor v `main/`:
```jsx
// resources/js/pages/main/Activity.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NotFound } from '../shared/NotFound';

export function Activity() {
    const [isEnabled, setIsEnabled] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/modules/check/activity')
            .then(response => {
                setIsEnabled(response.data.enabled);
                setLoading(false);
            })
            .catch(() => {
                setIsEnabled(false);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isEnabled) {
        return <NotFound />;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold">Activity</h1>
            {/* Your content here */}
        </div>
    );
}
```

Pak přidejte do `resources/js/components/App.jsx`:
```jsx
import { Activity } from '../pages/main/Activity';

<Route 
    path="activity" 
    element={
        <ProtectedRoute moduleName="activity">
            <Activity />
        </ProtectedRoute>
    } 
/>
```

### Content stránka
Vytvořte soubor v `content/`:
```jsx
// resources/js/pages/content/Facilities.jsx
export function Facilities() {
    return <div>Facilities content</div>;
}
```

### Modulární stránka (type/module)
Vytvořte soubor v `modules/` nebo v podsložce:
```jsx
// resources/js/pages/modules/facilities/RestaurantsBars.jsx
export function RestaurantsBars() {
    return <div>Restaurants & Bars</div>;
}
```

### Sdílená stránka
Vytvořte soubor v `shared/`:
```jsx
// resources/js/pages/shared/Loading.jsx
export function Loading() {
    return <div>Loading...</div>;
}
```

## Importy

Používejte relativní cesty:
- Z `main/` do `shared/`: `import { NotFound } from '../shared/NotFound';`
- Z `content/` do `shared/`: `import { NotFound } from '../shared/NotFound';`
- Z `modules/` do `shared/`: `import { NotFound } from '../shared/NotFound';`

## Ochrana modulů

Všechny stránky by měly kontrolovat, zda je modul enabled pomocí API:
```jsx
useEffect(() => {
    axios.get(`/api/modules/check/${moduleName}`)
        .then(response => {
            setIsEnabled(response.data.enabled);
        });
}, []);
```

Pokud modul není enabled, zobrazte `<NotFound />`.

