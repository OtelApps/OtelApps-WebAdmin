/** Metadata pro Content hub — ikony, barvy a popisy sekcí */
export const SECTION_META = {
    facilities: {
        icon: 'apartment',
        gradient: 'from-amber-500 to-orange-600',
        accent: 'orange',
        description:
            'Restaurace, wellness, pokoje, parkování a další prostory hotelu — vše, co host vidí v mapě a průvodci objektem.',
        hubPath: '/module/facilities/facilities',
    },
    services: {
        icon: 'room_service',
        gradient: 'from-blue-500 to-indigo-600',
        accent: 'blue',
        description:
            'Pokojová služba, doplňky, úklid a údržba. Obsah i objednávkové katalogy pro mobilní app.',
        hubPath: '/module/services/services',
    },
    other: {
        icon: 'widgets',
        gradient: 'from-slate-500 to-gray-600',
        accent: 'slate',
        description: 'Doplňkové informace, památky a další obsah mimo standardní kategorie.',
        hubPath: '/module/other/other',
    },
    leisure: {
        icon: 'celebration',
        gradient: 'from-violet-500 to-purple-600',
        accent: 'violet',
        description: 'Program volnočasových aktivit, kalendář akcí a tipy pro hosty.',
        hubPath: '/module/content/leisure',
    },
    welcome_message: {
        icon: 'waving_hand',
        gradient: 'from-emerald-500 to-teal-600',
        accent: 'emerald',
        description: 'Uvítací text a první dojem po otevření aplikace hostem.',
        hubPath: '/module/content/welcome_message',
    },
    smart_assistant: {
        icon: 'smart_toy',
        gradient: 'from-cyan-500 to-blue-600',
        accent: 'cyan',
        description: 'Nastavení chytrého asistenta a automatických odpovědí.',
        hubPath: '/module/smart_assistant/smart_assistant',
    },
    legal_texts: {
        icon: 'gavel',
        gradient: 'from-rose-500 to-red-600',
        accent: 'rose',
        description: 'GDPR, obchodní podmínky a právní dokumenty zobrazené v appce.',
        hubPath: '/module/legal_texts/legal_texts',
    },
    image_gallery: {
        icon: 'photo_library',
        gradient: 'from-pink-500 to-rose-600',
        accent: 'pink',
        description: 'Sdílená galerie fotografií pro všechny sekce hotelového obsahu.',
        hubPath: '/module/content/image_gallery',
    },
};

export const SUBMODULE_HINTS = {
    restaurants_bars: 'Restaurace, bary a jídelní lístky',
    relax_sport: 'Wellness, sauna a sportovní zázemí',
    hotel_info: 'Informace o hotelu a okolí',
    hotel_rooms: 'Typy pokojů a vybavení',
    parking: 'Parkování a doprava',
    room_service: 'Menu pokojové služby',
    amenities: 'Doplňky a minibar',
    laundry: 'Úklid a praní prádla',
    issues_repairs: 'Hlášení závad a oprav',
    check_in_out: 'Check-in a check-out',
    places_of_interest: 'Památky a zajímavá místa v okolí',
    transportation: 'Doprava a spoje MHD',
    where_to_go: 'Tipy na výlety a kam zajít',
    generic_other: 'Ostatní volný obsah',
};

export const QUICK_START_STEPS = [
    {
        icon: 'edit_note',
        title: 'Doplňte základ hotelu',
        text: 'Začněte u Informací o hotelu a Nabídky pokojů — hosti je vidí nejčastěji.',
    },
    {
        icon: 'restaurant',
        title: 'Nahrajte menu a fotky',
        text: 'Restaurace a pokojová služba prodávají nejlépe s aktuálním menu a kvalitními fotografiemi.',
    },
    {
        icon: 'sync',
        title: 'Udržujte obsah aktuální',
        text: 'Po změně sezóny nebo ceníku aktualizujte příslušnou sekci — změny se projeví v mobilní app.',
    },
];

/** Moduly s vlastním typem v routeru (ne /module/content/…) */
export function modulePath(key) {
    const meta = SECTION_META[key];
    if (meta?.hubPath) return meta.hubPath;
    return `/module/${key}/${key}`;
}

export function submodulePath(sectionKey, subKey) {
    return `/module/${sectionKey}/${subKey}`;
}
