import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type FitnessFacilityRow = {
  id: string;
  slug: string;
  title: string;
  list_label: string | null;
  schedule_summary: string | null;
  description_long: string | null;
  image_key: string | null;
  detail_screen: 'GymDetail' | 'TenisoveKurtyDetail';
  sort_order: number;
};

export type FitnessFacilityHourRow = {
  day_order: number;
  day_name: string;
  hours_text: string;
};

export type FitnessFacilityImageRow = {
  image_key: string | null;
  image_url: string | null;
  sort_order: number;
};

export type FitnessFacilityListItem = FitnessFacilityRow & {
  openingHours: FitnessFacilityHourRow[];
};

/** Seznam oblastí Posilovna & Sport */
export async function fetchFitnessFacilities(): Promise<FitnessFacilityListItem[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.fitnessFacilities)
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
      fitness_facility_hours (
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
    detail_screen: row.detail_screen as FitnessFacilityRow['detail_screen'],
    sort_order: row.sort_order,
    openingHours: [...((row.fitness_facility_hours as FitnessFacilityHourRow[]) ?? [])].sort(
      (a, b) => a.day_order - b.day_order
    ),
  }));
}

/** Detail oblasti včetně otevírací doby a galerie */
export async function fetchFitnessFacilityDetail(facilitySlug: string): Promise<{
  facility: FitnessFacilityRow;
  openingHours: FitnessFacilityHourRow[];
  images: FitnessFacilityImageRow[];
} | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: facility, error: facilityError } = await supabase
    .from(SupabaseTables.fitnessFacilities)
    .select(
      'id, slug, title, list_label, schedule_summary, description_long, image_key, detail_screen, sort_order'
    )
    .eq('slug', facilitySlug)
    .eq('is_active', true)
    .maybeSingle();

  if (facilityError) throw facilityError;
  if (!facility) return null;

  const [hoursRes, imagesRes] = await Promise.all([
    supabase
      .from(SupabaseTables.fitnessFacilityHours)
      .select('day_order, day_name, hours_text')
      .eq('facility_id', facility.id)
      .order('day_order'),
    supabase
      .from(SupabaseTables.fitnessFacilityImages)
      .select('image_key, image_url, sort_order')
      .eq('facility_id', facility.id)
      .order('sort_order'),
  ]);

  if (hoursRes.error) throw hoursRes.error;
  if (imagesRes.error) throw imagesRes.error;

  return {
    facility: facility as FitnessFacilityRow,
    openingHours: hoursRes.data ?? [],
    images: imagesRes.data ?? [],
  };
}
