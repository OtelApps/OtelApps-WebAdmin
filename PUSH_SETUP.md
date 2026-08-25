# Push notifikace — nastavení pro test

Viz také `OtelApps/PUSH_SETUP.md` v mobilním repozitáři.

SQL migrace: `database/supabase/hotel_guest_push_tokens.sql`

API endpointy:

- `GET /api/crm/push/audience` — náhled dosahu
- `POST /api/crm/push` — odeslání custom push + CRM alert
- Nastavení push: `PUT /api/notifications/settings` (`guest_push_enabled`, `guest_push_on_status_change`)
