/** Moduly zobrazené v menu, ale zatím bez funkční implementace */
export const UNAVAILABLE_MODULE_KEYS = new Set(['check_in_out']);

export function isModuleUnavailable(moduleKey) {
    return UNAVAILABLE_MODULE_KEYS.has(moduleKey);
}
