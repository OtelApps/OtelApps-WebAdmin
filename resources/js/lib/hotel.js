/**
 * Hotel z URL /h/{slug}. Env slug je fallback a default pro staff.
 */
export function getHotelSlug() {
    const match = window.location.pathname.match(/^\/h\/([a-z0-9]+(?:-[a-z0-9]+)*)/i);
    if (match) {
        return match[1].toLowerCase();
    }
    return window.__OTELAPPS_BOOTSTRAP__?.hotelSlug
        || window.__OTELAPPS_HOTEL_SLUG__
        || 'default';
}

export function hotelBasename() {
    return `/h/${getHotelSlug()}`;
}

export function ensureHotelPath() {
    const path = window.location.pathname;
    if (/^\/h\/[a-z0-9]+(?:-[a-z0-9]+)*/i.test(path)) {
        return true;
    }
    const slug = window.__OTELAPPS_HOTEL_SLUG__
        || window.__OTELAPPS_BOOTSTRAP__?.envHotelSlug
        || 'default';
    const suffix = path === '/' ? '/' : path;
    window.location.replace(`/h/${slug}${suffix}${window.location.search}${window.location.hash}`);
    return false;
}

export function syncStaffHotelPath(user) {
    if (!user || user.is_superadmin) {
        return;
    }
    const envSlug = window.__OTELAPPS_BOOTSTRAP__?.envHotelSlug;
    if (!envSlug) {
        return;
    }
    if (getHotelSlug() === envSlug) {
        return;
    }
    const rest = window.location.pathname.replace(/^\/h\/[^/]+/, '') || '/';
    window.location.replace(`/h/${envSlug}${rest}${window.location.search}${window.location.hash}`);
}
