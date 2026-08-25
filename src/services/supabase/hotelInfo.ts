import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type HotelInfoNavigationScreen =
  | 'HotelDetail'
  | 'RecepceDetail'
  | 'SpojeniDetail'
  | 'SejfDetail'
  | 'MapScreen';

export type HotelInfoTopicRow = {
  id: string;
  slug: string;
  title: string;
  list_description: string;
  detail_info: string | null;
  list_image_key: string | null;
  detail_image_key: string | null;
  navigation_screen: HotelInfoNavigationScreen;
  sort_order: number;
};

export type HotelInfoSectionRow = {
  slug: string;
  title: string;
  description: string;
  icon_library: 'ionicons' | 'material-community';
  icon_name: string;
  sort_order: number;
};

/** Seznam témat (obrazovka Informace o hotelu) */
export async function fetchHotelInfoTopics(): Promise<HotelInfoTopicRow[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.hotelInfoTopics)
    .select(
      'id, slug, title, list_description, detail_info, list_image_key, detail_image_key, navigation_screen, sort_order'
    )
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data as HotelInfoTopicRow[];
}

/** Detail tématu včetně podsekcí */
export async function fetchHotelInfoTopicDetail(topicSlug: string): Promise<{
  topic: HotelInfoTopicRow;
  sections: HotelInfoSectionRow[];
} | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: topic, error: topicError } = await supabase
    .from(SupabaseTables.hotelInfoTopics)
    .select(
      'id, slug, title, list_description, detail_info, list_image_key, detail_image_key, navigation_screen, sort_order'
    )
    .eq('slug', topicSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (topicError) throw topicError;
  if (!topic) return null;

  const { data: sections, error: sectionsError } = await supabase
    .from(SupabaseTables.hotelInfoSections)
    .select('slug, title, description, icon_library, icon_name, sort_order')
    .eq('topic_id', topic.id)
    .order('sort_order');

  if (sectionsError) throw sectionsError;

  return {
    topic: topic as HotelInfoTopicRow,
    sections: (sections ?? []) as HotelInfoSectionRow[],
  };
}
