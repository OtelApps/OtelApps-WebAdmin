export const GUEST_LOCALES = [
    { code: 'cs', label: 'Čeština', flag: '🇨🇿', country: 'CZ' },
    { code: 'en', label: 'English', flag: '🇬🇧', country: 'EN' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪', country: 'DE' },
    { code: 'fr', label: 'Français', flag: '🇫🇷', country: 'FR' },
    { code: 'pl', label: 'Polski', flag: '🇵🇱', country: 'PL' },
];

export function localeMeta(code) {
    return GUEST_LOCALES.find((l) => l.code === code) ?? GUEST_LOCALES[0];
}
