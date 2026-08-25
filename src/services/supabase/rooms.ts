import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type HotelRoomTypeRow = {
  id: string;
  slug: string;
  title: string;
  list_description: string;
  detail_info: string;
  size_text: string | null;
  image_key: string | null;
  sort_order: number;
};

export type HotelRoomTypeFeatureRow = {
  label: string;
  sort_order: number;
};

/** Seznam typů pokojů (Nabídka pokojů) */
export async function fetchHotelRoomTypes(): Promise<HotelRoomTypeRow[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.hotelRoomTypes)
    .select('id, slug, title, list_description, detail_info, size_text, image_key, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data as HotelRoomTypeRow[];
}

/** Detail typu pokoje včetně vybavení */
export async function fetchHotelRoomTypeDetail(roomSlug: string): Promise<{
  room: HotelRoomTypeRow;
  features: string[];
} | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: room, error: roomError } = await supabase
    .from(SupabaseTables.hotelRoomTypes)
    .select('id, slug, title, list_description, detail_info, size_text, image_key, sort_order')
    .eq('slug', roomSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (roomError) throw roomError;
  if (!room) return null;

  const { data: features, error: featuresError } = await supabase
    .from(SupabaseTables.hotelRoomTypeFeatures)
    .select('label, sort_order')
    .eq('room_type_id', room.id)
    .order('sort_order');

  if (featuresError) throw featuresError;

  return {
    room: room as HotelRoomTypeRow,
    features: (features ?? []).map((f) => f.label),
  };
}
