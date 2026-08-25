import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type RelaxSportAreaSlug = 'wellness-spa' | 'gym-sport';

export type RelaxSportListScreen = 'WellnessSpaList' | 'PosilovnaSportList';

export type RelaxSportHomeAreaRow = {
  area_slug: RelaxSportAreaSlug;
  home_title: string;
  home_image_key: string | null;
  list_screen: RelaxSportListScreen;
  list_title: string;
  sort_order: number;
  enabled_area_count: number;
  section_title: string;
};

export type RelaxSportAreaRow = {
  slug: RelaxSportAreaSlug;
  home_title: string;
  list_title: string;
  list_screen: RelaxSportListScreen;
  is_enabled: boolean;
};

/** Domovská obrazovka — aktivní dlaždice Relax & Sport */
export async function fetchRelaxSportHomeAreas(): Promise<RelaxSportHomeAreaRow[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.relaxSportHomeExport)
    .select(
      'area_slug, home_title, home_image_key, list_screen, list_title, sort_order, enabled_area_count, section_title'
    )
    .order('sort_order');

  if (error) throw error;
  return (data ?? []) as RelaxSportHomeAreaRow[];
}

/** Nadpis seznamu podle oblasti (Wellness / Posilovna) */
export async function fetchRelaxSportArea(
  areaSlug: RelaxSportAreaSlug
): Promise<RelaxSportAreaRow | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: instance, error: instanceError } = await supabase
    .from(SupabaseTables.hotelRelaxSport)
    .select('id')
    .eq('is_active', true)
    .maybeSingle();

  if (instanceError) throw instanceError;
  if (!instance) return null;

  const { data, error } = await supabase
    .from(SupabaseTables.hotelRelaxSportAreas)
    .select('slug, home_title, list_title, list_screen, is_enabled')
    .eq('relax_sport_id', instance.id)
    .eq('slug', areaSlug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    slug: data.slug as RelaxSportAreaSlug,
    home_title: data.home_title,
    list_title: data.list_title,
    list_screen: data.list_screen as RelaxSportListScreen,
    is_enabled: data.is_enabled,
  };
}
