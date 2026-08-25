import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type HotelPlaceRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  long_description: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  category: 'place' | 'atm' | 'other';
  opening_hours: string | null;
  admission: string | null;
  image_url: string | null;
  is_recommended: boolean;
  sort_order: number;
};

/** Aktivní místa hotelu pro mapu a trip planner. */
export async function fetchHotelPlaces(): Promise<HotelPlaceRow[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.hotelPlaces)
    .select(
      'id, slug, name, description, long_description, address, latitude, longitude, category, opening_hours, admission, image_url, is_recommended, sort_order'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as HotelPlaceRow[];
  // Doporučená první (řazení v JS — spolehlivější než multi-order na boolean).
  return rows.sort((a, b) => {
    const rec = Number(Boolean(b.is_recommended)) - Number(Boolean(a.is_recommended));
    if (rec !== 0) return rec;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name, 'cs');
  });
}
