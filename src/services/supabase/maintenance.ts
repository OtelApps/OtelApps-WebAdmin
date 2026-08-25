import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type HotelMaintenanceHourRow = {
  day_order: number;
  day_name: string;
  hours_text: string;
};

export type HotelMaintenanceItemRow = {
  slug: string;
  label: string;
  icon_library: 'ionicons' | 'material-community';
  icon_name: string;
  sort_order: number;
};

export type HotelMaintenanceCategoryRow = {
  slug: string;
  title: string;
  sort_order: number;
  items: HotelMaintenanceItemRow[];
};

export type HotelMaintenanceData = {
  slug: string;
  title: string;
  description: string;
  description_extra: string | null;
  schedule_summary: string | null;
  header_image_key: string | null;
  openingHours: HotelMaintenanceHourRow[];
  categories: HotelMaintenanceCategoryRow[];
};

/** Katalog údržby a oprav */
export async function fetchHotelMaintenance(
  maintenanceSlug = 'udrzba-opravy'
): Promise<HotelMaintenanceData | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: maintenance, error: maintenanceError } = await supabase
    .from(SupabaseTables.hotelMaintenance)
    .select('id, slug, title, description, description_extra, schedule_summary, header_image_key')
    .eq('slug', maintenanceSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (maintenanceError) throw maintenanceError;
  if (!maintenance) return null;

  const [hoursRes, categoriesRes] = await Promise.all([
    supabase
      .from(SupabaseTables.hotelMaintenanceHours)
      .select('day_order, day_name, hours_text')
      .eq('maintenance_id', maintenance.id)
      .order('day_order'),
    supabase
      .from(SupabaseTables.hotelMaintenanceCategories)
      .select(
        `
        slug,
        title,
        sort_order,
        hotel_maintenance_items (
          slug,
          label,
          icon_library,
          icon_name,
          sort_order
        )
      `
      )
      .eq('maintenance_id', maintenance.id)
      .order('sort_order'),
  ]);

  if (hoursRes.error) throw hoursRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  const categories: HotelMaintenanceCategoryRow[] = (categoriesRes.data ?? []).map((cat) => {
    const items = (cat.hotel_maintenance_items as HotelMaintenanceItemRow[] | null) ?? [];
    return {
      slug: cat.slug,
      title: cat.title,
      sort_order: cat.sort_order,
      items: [...items].sort((a, b) => a.sort_order - b.sort_order),
    };
  });

  return {
    slug: maintenance.slug,
    title: maintenance.title,
    description: maintenance.description,
    description_extra: maintenance.description_extra,
    schedule_summary: maintenance.schedule_summary,
    header_image_key: maintenance.header_image_key,
    openingHours: hoursRes.data ?? [],
    categories,
  };
}
