import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type WellnessFacilityRow = {
  id: string;
  slug: string;
  title: string;
  list_label: string | null;
  schedule_summary: string | null;
  description_long: string | null;
  image_key: string | null;
  detail_screen: 'PoolDetail' | 'WellnessDetail' | 'ThaiMassageDetail';
  sort_order: number;
};

export type WellnessFacilityHourRow = {
  day_order: number;
  day_name: string;
  hours_text: string;
};

export type WellnessServiceRow = {
  slug: string;
  name: string;
  duration_minutes: number;
  price_amount: number;
  currency: string;
  sort_order: number;
};

export type WellnessProgramEventRow = {
  day_order: number;
  start_time: string;
  title: string;
  description: string | null;
  sort_order: number;
};

export type WellnessFacilityListItem = WellnessFacilityRow & {
  openingHours: WellnessFacilityHourRow[];
};

/** Formát ceny jako v UI: „1499.9Kč“ */
export function formatWellnessPrice(amount: number): string {
  const text = Number.isInteger(amount) ? String(amount) : String(amount);
  return `${text}Kč`;
}

export function formatDurationMinutes(minutes: number): string {
  return `${minutes} minut`;
}

/** Seznam oblastí (Wellness & SPA) */
export async function fetchWellnessFacilities(): Promise<WellnessFacilityListItem[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.wellnessFacilities)
    .select(
      `
      id,
      slug,
      title,
      list_label,
      schedule_summary,
      description_long,
      image_key,
      detail_screen,
      sort_order,
      wellness_facility_hours (
        day_order,
        day_name,
        hours_text
      )
    `
    )
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    list_label: row.list_label,
    schedule_summary: row.schedule_summary,
    description_long: row.description_long,
    image_key: row.image_key,
    detail_screen: row.detail_screen as WellnessFacilityRow['detail_screen'],
    sort_order: row.sort_order,
    openingHours: [...((row.wellness_facility_hours as WellnessFacilityHourRow[]) ?? [])].sort(
      (a, b) => a.day_order - b.day_order
    ),
  }));
}

/** Detail oblasti včetně otevírací doby a služeb (masáže) */
export async function fetchWellnessFacilityDetail(facilitySlug: string): Promise<{
  facility: WellnessFacilityRow;
  openingHours: WellnessFacilityHourRow[];
  services: WellnessServiceRow[];
} | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: facility, error: facilityError } = await supabase
    .from(SupabaseTables.wellnessFacilities)
    .select(
      'id, slug, title, list_label, schedule_summary, description_long, image_key, detail_screen, sort_order'
    )
    .eq('slug', facilitySlug)
    .eq('is_active', true)
    .maybeSingle();

  if (facilityError) throw facilityError;
  if (!facility) return null;

  const [hoursRes, servicesRes] = await Promise.all([
    supabase
      .from(SupabaseTables.wellnessFacilityHours)
      .select('day_order, day_name, hours_text')
      .eq('facility_id', facility.id)
      .order('day_order'),
    supabase
      .from(SupabaseTables.wellnessServices)
      .select('slug, name, duration_minutes, price_amount, currency, sort_order')
      .eq('facility_id', facility.id)
      .eq('is_available', true)
      .order('sort_order'),
  ]);

  if (hoursRes.error) throw hoursRes.error;
  if (servicesRes.error) throw servicesRes.error;

  return {
    facility: facility as WellnessFacilityRow,
    openingHours: hoursRes.data ?? [],
    services: (servicesRes.data ?? []).map((s) => ({
      ...s,
      price_amount: Number(s.price_amount),
    })),
  };
}

/** Hotelový program — akce podle dne v týdnu */
export async function fetchWellnessProgramEvents(): Promise<WellnessProgramEventRow[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.wellnessProgramEvents)
    .select('day_order, start_time, title, description, sort_order')
    .eq('is_active', true)
    .order('day_order')
    .order('start_time')
    .order('sort_order');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    day_order: row.day_order,
    start_time: formatProgramTime(row.start_time),
    title: row.title,
    description: row.description,
    sort_order: row.sort_order,
  }));
}

function formatProgramTime(value: string): string {
  if (/^\d{1,2}:\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return value;
}
