import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type VenueRow = {
  id: string;
  slug: string;
  title: string;
  venue_type: 'restaurant' | 'bar';
  description: string | null;
  schedule_summary: string | null;
  image_key: string | null;
  list_label: string | null;
  sort_order: number;
};

export type VenueOpeningHourRow = {
  day_order: number;
  day_name: string;
  hours_text: string;
};

export type MenuCategoryRow = {
  slug: string;
  title: string;
  sort_order: number;
};

export type MenuItemRow = {
  slug: string;
  name: string;
  description_short: string | null;
  description_long: string | null;
  price_amount: number;
  currency: string;
  sort_order: number;
  menu_item_allergens: { allergen_code: string }[];
};

/** Formát ceny jako v UI: „85Kč“ */
export function formatPriceCzk(amount: number): string {
  return `${amount}Kč`;
}

/** Seznam restaurací a barů (obrazovka Restaurace & bary) */
export async function fetchVenues(): Promise<VenueRow[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.venues)
    .select(
      'id, slug, title, venue_type, description, schedule_summary, image_key, list_label, sort_order'
    )
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data;
}

/** Detail podniku včetně otevírací doby */
export async function fetchVenueDetail(venueSlug: string): Promise<{
  venue: VenueRow;
  openingHours: VenueOpeningHourRow[];
  menus: { slug: string; title: string; navigation_screen: string; sort_order: number }[];
} | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: venue, error: venueError } = await supabase
    .from(SupabaseTables.venues)
    .select(
      'id, slug, title, venue_type, description, schedule_summary, image_key, list_label, sort_order'
    )
    .eq('slug', venueSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (venueError) throw venueError;
  if (!venue) return null;

  const [hoursRes, menusRes] = await Promise.all([
    supabase
      .from(SupabaseTables.venueOpeningHours)
      .select('day_order, day_name, hours_text')
      .eq('venue_id', venue.id)
      .order('day_order'),
    supabase
      .from(SupabaseTables.menus)
      .select('slug, title, navigation_screen, sort_order')
      .eq('venue_id', venue.id)
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  if (hoursRes.error) throw hoursRes.error;
  if (menusRes.error) throw menusRes.error;

  return {
    venue,
    openingHours: hoursRes.data ?? [],
    menus: menusRes.data ?? [],
  };
}

/** Kategorie menu (např. akční položky u Lobby baru) */
export async function fetchMenuCategoryList(
  venueSlug: string,
  menuSlug: string
): Promise<{ slug: string; title: string; sort_order: number }[] | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: venue } = await supabase
    .from(SupabaseTables.venues)
    .select('id')
    .eq('slug', venueSlug)
    .maybeSingle();

  if (!venue) return null;

  const { data: menu } = await supabase
    .from(SupabaseTables.menus)
    .select('id')
    .eq('venue_id', venue.id)
    .eq('slug', menuSlug)
    .maybeSingle();

  if (!menu) return null;

  const { data, error } = await supabase
    .from(SupabaseTables.menuCategories)
    .select('slug, title, sort_order')
    .eq('menu_id', menu.id)
    .order('sort_order');

  if (error) throw error;
  return data;
}

/** Název menu podle slugu (nadpis obrazovky menu) */
export async function fetchMenuTitle(venueSlug: string, menuSlug: string): Promise<string | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: venue } = await supabase
    .from(SupabaseTables.venues)
    .select('id')
    .eq('slug', venueSlug)
    .maybeSingle();

  if (!venue) return null;

  const { data, error } = await supabase
    .from(SupabaseTables.menus)
    .select('title')
    .eq('venue_id', venue.id)
    .eq('slug', menuSlug)
    .maybeSingle();

  if (error) throw error;
  return data?.title ?? null;
}

/**
 * Menu pro obrazovku RestaurantMenu / LobbyBarMenu.
 * @param menuSlug u Food&Mood typicky `menu`, u Lobby baru `main`
 */
export async function fetchMenuCategoriesWithItems(
  venueSlug: string,
  menuSlug: string
): Promise<
  | {
      id: string;
      title: string;
      items: { id: string; name: string; description?: string; price: string }[];
    }[]
  | null
> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: venue } = await supabase
    .from(SupabaseTables.venues)
    .select('id')
    .eq('slug', venueSlug)
    .maybeSingle();

  if (!venue) return null;

  const { data: menu } = await supabase
    .from(SupabaseTables.menus)
    .select('id')
    .eq('venue_id', venue.id)
    .eq('slug', menuSlug)
    .maybeSingle();

  if (!menu) return null;

  const { data: categories, error } = await supabase
    .from(SupabaseTables.menuCategories)
    .select(
      `
      slug,
      title,
      sort_order,
      menu_items (
        slug,
        name,
        description_short,
        price_amount,
        sort_order
      )
    `
    )
    .eq('menu_id', menu.id)
    .order('sort_order');

  if (error) throw error;

  return (categories ?? []).map((cat) => {
    const items = (cat.menu_items as MenuItemRow[] | null) ?? [];
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

    return {
      id: cat.slug,
      title: cat.title,
      items: sorted.map((item) => ({
        id: item.slug,
        name: item.name,
        description: item.description_short ?? undefined,
        price: formatPriceCzk(item.price_amount),
      })),
    };
  });
}

/** Detail jedné položky menu */
export async function fetchMenuItemDetail(
  venueSlug: string,
  menuSlug: string,
  categorySlug: string,
  itemSlug: string
): Promise<{
  title: string;
  info: string;
  price: string;
  allergens: string[];
} | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: venue } = await supabase
    .from(SupabaseTables.venues)
    .select('id')
    .eq('slug', venueSlug)
    .maybeSingle();

  if (!venue) return null;

  const { data: menu } = await supabase
    .from(SupabaseTables.menus)
    .select('id')
    .eq('venue_id', venue.id)
    .eq('slug', menuSlug)
    .maybeSingle();

  if (!menu) return null;

  const { data: category } = await supabase
    .from(SupabaseTables.menuCategories)
    .select('id')
    .eq('menu_id', menu.id)
    .eq('slug', categorySlug)
    .maybeSingle();

  if (!category) return null;

  const { data: item, error } = await supabase
    .from(SupabaseTables.menuItems)
    .select(
      `
      name,
      description_long,
      price_amount,
      menu_item_allergens ( allergen_code )
    `
    )
    .eq('category_id', category.id)
    .eq('slug', itemSlug)
    .eq('is_available', true)
    .maybeSingle();

  if (error) throw error;
  if (!item) return null;

  const allergens =
    (item.menu_item_allergens as { allergen_code: string }[] | null)?.map((a) => a.allergen_code) ??
    [];

  return {
    title: item.name,
    info: item.description_long ?? '',
    price: formatPriceCzk(item.price_amount),
    allergens,
  };
}
