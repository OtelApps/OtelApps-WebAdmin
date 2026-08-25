import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type HotelHousekeepingHourRow = {
  day_order: number;
  day_name: string;
  hours_text: string;
};

export type HotelHousekeepingItemRow = {
  slug: string;
  title: string;
  icon_image_key: string | null;
  sort_order: number;
};

export type HotelHousekeepingCategoryRow = {
  slug: string;
  title: string;
  sort_order: number;
  items: HotelHousekeepingItemRow[];
};

export type HotelHousekeepingData = {
  slug: string;
  title: string;
  description: string;
  schedule_summary: string | null;
  header_image_key: string | null;
  openingHours: HotelHousekeepingHourRow[];
  categories: HotelHousekeepingCategoryRow[];
};

/** Katalog služby Úklid pokoje */
export async function fetchHotelHousekeeping(
  housekeepingSlug = 'uklid-pokoje'
): Promise<HotelHousekeepingData | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: housekeeping, error: housekeepingError } = await supabase
    .from(SupabaseTables.hotelHousekeeping)
    .select('id, slug, title, description, schedule_summary, header_image_key')
    .eq('slug', housekeepingSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (housekeepingError) throw housekeepingError;
  if (!housekeeping) return null;

  const [hoursRes, categoriesRes] = await Promise.all([
    supabase
      .from(SupabaseTables.hotelHousekeepingHours)
      .select('day_order, day_name, hours_text')
      .eq('housekeeping_id', housekeeping.id)
      .order('day_order'),
    supabase
      .from(SupabaseTables.hotelHousekeepingCategories)
      .select(
        `
        slug,
        title,
        sort_order,
        hotel_housekeeping_items (
          slug,
          title,
          icon_image_key,
          sort_order
        )
      `
      )
      .eq('housekeeping_id', housekeeping.id)
      .order('sort_order'),
  ]);

  if (hoursRes.error) throw hoursRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  const categories: HotelHousekeepingCategoryRow[] = (categoriesRes.data ?? []).map((cat) => {
    const items = (cat.hotel_housekeeping_items as HotelHousekeepingItemRow[] | null) ?? [];
    return {
      slug: cat.slug,
      title: cat.title,
      sort_order: cat.sort_order,
      items: [...items].sort((a, b) => a.sort_order - b.sort_order),
    };
  });

  return {
    slug: housekeeping.slug,
    title: housekeeping.title,
    description: housekeeping.description,
    schedule_summary: housekeeping.schedule_summary,
    header_image_key: housekeeping.header_image_key,
    openingHours: hoursRes.data ?? [],
    categories,
  };
}
