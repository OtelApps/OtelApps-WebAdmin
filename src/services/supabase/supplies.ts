import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type HotelSuppliesHourRow = {
  day_order: number;
  day_name: string;
  hours_text: string;
};

export type HotelSuppliesItemRow = {
  slug: string;
  name: string;
  icon_emoji: string | null;
  sort_order: number;
};

export type HotelSuppliesCategoryRow = {
  slug: string;
  title: string;
  sort_order: number;
  items: HotelSuppliesItemRow[];
};

export type HotelSuppliesData = {
  slug: string;
  title: string;
  description: string;
  schedule_summary: string | null;
  header_image_key: string | null;
  max_quantity_per_item: number;
  openingHours: HotelSuppliesHourRow[];
  categories: HotelSuppliesCategoryRow[];
};

/** Katalog doplňků a toaletních potřeb */
export async function fetchHotelSupplies(
  suppliesSlug = 'doplnky'
): Promise<HotelSuppliesData | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: supplies, error: suppliesError } = await supabase
    .from(SupabaseTables.hotelSupplies)
    .select(
      'id, slug, title, description, schedule_summary, header_image_key, max_quantity_per_item'
    )
    .eq('slug', suppliesSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (suppliesError) throw suppliesError;
  if (!supplies) return null;

  const [hoursRes, categoriesRes] = await Promise.all([
    supabase
      .from(SupabaseTables.hotelSuppliesHours)
      .select('day_order, day_name, hours_text')
      .eq('supplies_id', supplies.id)
      .order('day_order'),
    supabase
      .from(SupabaseTables.hotelSuppliesCategories)
      .select(
        `
        slug,
        title,
        sort_order,
        hotel_supplies_items (
          slug,
          name,
          icon_emoji,
          sort_order
        )
      `
      )
      .eq('supplies_id', supplies.id)
      .order('sort_order'),
  ]);

  if (hoursRes.error) throw hoursRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  const categories: HotelSuppliesCategoryRow[] = (categoriesRes.data ?? []).map((cat) => {
    const items = (cat.hotel_supplies_items as HotelSuppliesItemRow[] | null) ?? [];
    return {
      slug: cat.slug,
      title: cat.title,
      sort_order: cat.sort_order,
      items: [...items].sort((a, b) => a.sort_order - b.sort_order),
    };
  });

  return {
    slug: supplies.slug,
    title: supplies.title,
    description: supplies.description,
    schedule_summary: supplies.schedule_summary,
    header_image_key: supplies.header_image_key,
    max_quantity_per_item: supplies.max_quantity_per_item,
    openingHours: hoursRes.data ?? [],
    categories,
  };
}
