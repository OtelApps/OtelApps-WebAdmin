import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type ParkingTopicRow = {
  id: string;
  slug: string;
  title: string;
  list_description: string;
  detail_info: string | null;
  list_image_key: string | null;
  detail_image_key: string | null;
  navigation_screen: 'ParkingDetail' | null;
  external_url: string | null;
  sort_order: number;
};

/** Seznam položek parkování */
export async function fetchParkingTopics(): Promise<ParkingTopicRow[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.hotelParkingTopics)
    .select(
      'id, slug, title, list_description, detail_info, list_image_key, detail_image_key, navigation_screen, external_url, sort_order'
    )
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data as ParkingTopicRow[];
}

/** Detail parkování v hotelu */
export async function fetchParkingTopicDetail(topicSlug: string): Promise<ParkingTopicRow | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.hotelParkingTopics)
    .select(
      'id, slug, title, list_description, detail_info, list_image_key, detail_image_key, navigation_screen, external_url, sort_order'
    )
    .eq('slug', topicSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as ParkingTopicRow | null;
}
