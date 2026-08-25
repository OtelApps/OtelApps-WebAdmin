import { SupabaseTables } from './tables';
import { getSupabase, supabaseConfigured } from '../../lib/supabase';

export type RoomServiceNavigationScreen = 'SnidaneScreen' | 'ObedScreen' | 'VecereScreen';
export type RoomServiceConfirmScreen =
  | 'ConfirmSnidaneScreen'
  | 'ConfirmObedScreen'
  | 'ConfirmVecereScreen';

export type RoomServiceMenuListRow = {
  slug: string;
  title: string;
  list_label: string;
  list_schedule_summary: string | null;
  list_image_key: string | null;
  navigation_screen: RoomServiceNavigationScreen;
  sort_order: number;
};

export type RoomServiceHourRow = {
  day_order: number;
  day_name: string;
  hours_text: string;
};

export type RoomServiceItemOptionRow = {
  slug: string;
  label: string;
  price_amount: number;
  sort_order: number;
};

export type RoomServiceItemRow = {
  slug: string;
  name: string;
  description_short: string | null;
  icon_emoji: string | null;
  price_amount: number;
  requires_option: boolean;
  sort_order: number;
  options: RoomServiceItemOptionRow[];
};

export type RoomServiceCategoryRow = {
  slug: string;
  title: string;
  sort_order: number;
  items: RoomServiceItemRow[];
};

export type RoomServiceMenuDetail = {
  slug: string;
  title: string;
  description: string;
  schedule_summary: string | null;
  header_image_key: string | null;
  juice_modal_title: string | null;
  confirm_screen: RoomServiceConfirmScreen;
  openingHours: RoomServiceHourRow[];
  categories: RoomServiceCategoryRow[];
};

/** Karty pokojové služby (záložka Pokojová služba) */
export async function fetchRoomServiceMenus(): Promise<RoomServiceMenuListRow[] | null> {
  if (!supabaseConfigured) return null;

  const { data, error } = await getSupabase()
    .from(SupabaseTables.hotelRoomServiceMenus)
    .select(
      'slug, title, list_label, list_schedule_summary, list_image_key, navigation_screen, sort_order'
    )
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data as RoomServiceMenuListRow[];
}

/** Detail menu (Snídaně / Oběd / Večeře) */
export async function fetchRoomServiceMenuDetail(
  menuSlug: string
): Promise<RoomServiceMenuDetail | null> {
  if (!supabaseConfigured) return null;

  const supabase = getSupabase();

  const { data: menu, error: menuError } = await supabase
    .from(SupabaseTables.hotelRoomServiceMenus)
    .select(
      'id, slug, title, description, schedule_summary, header_image_key, juice_modal_title, confirm_screen'
    )
    .eq('slug', menuSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (menuError) throw menuError;
  if (!menu) return null;

  const [hoursRes, categoriesRes] = await Promise.all([
    supabase
      .from(SupabaseTables.hotelRoomServiceHours)
      .select('day_order, day_name, hours_text')
      .eq('menu_id', menu.id)
      .order('day_order'),
    supabase
      .from(SupabaseTables.hotelRoomServiceCategories)
      .select(
        `
        slug,
        title,
        sort_order,
        hotel_room_service_items (
          slug,
          name,
          description_short,
          icon_emoji,
          price_amount,
          requires_option,
          sort_order,
          hotel_room_service_item_options (
            slug,
            label,
            price_amount,
            sort_order
          )
        )
      `
      )
      .eq('menu_id', menu.id)
      .order('sort_order'),
  ]);

  if (hoursRes.error) throw hoursRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  const categories: RoomServiceCategoryRow[] = (categoriesRes.data ?? []).map((cat) => {
    const rawItems =
      (cat.hotel_room_service_items as
        | (RoomServiceItemRow & {
            hotel_room_service_item_options: RoomServiceItemOptionRow[] | null;
          })[]
        | null) ?? [];

    const items = [...rawItems]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        slug: item.slug,
        name: item.name,
        description_short: item.description_short,
        icon_emoji: item.icon_emoji,
        price_amount: Number(item.price_amount),
        requires_option: item.requires_option,
        sort_order: item.sort_order,
        options: [...(item.hotel_room_service_item_options ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((o) => ({
            slug: o.slug,
            label: o.label,
            price_amount: Number(o.price_amount),
            sort_order: o.sort_order,
          })),
      }));

    return {
      slug: cat.slug,
      title: cat.title,
      sort_order: cat.sort_order,
      items,
    };
  });

  return {
    slug: menu.slug,
    title: menu.title,
    description: menu.description,
    schedule_summary: menu.schedule_summary,
    header_image_key: menu.header_image_key,
    juice_modal_title: menu.juice_modal_title,
    confirm_screen: menu.confirm_screen as RoomServiceConfirmScreen,
    openingHours: hoursRes.data ?? [],
    categories,
  };
}

export function formatRoomServicePrice(amount: number): string {
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  return `${text}Kč`;
}
