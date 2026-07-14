const HOTEL_NAME = 'OtelApps Hotel';

const SEVERITY_META = {
    critical: { prefix: '🔴', tag: 'Naléhavé' },
    warning: { prefix: '⚡', tag: 'Důležité' },
    info: { prefix: '✨', tag: 'Pro vás' },
};

export function buildCrmPushPreview({ title, body, severity = 'info' }) {
    const meta = SEVERITY_META[severity] ?? SEVERITY_META.info;
    const headline = (title || '').trim();
    const messageBody = (body || '').trim();

    return {
        title: HOTEL_NAME,
        subtitle: headline ? `${meta.prefix} ${headline}` : `${meta.prefix} ${meta.tag}`,
        body:
            messageBody ||
            'Máme pro vás novinku přímo z hotelu. Otevřete aplikaci a podívejte se na detail.',
    };
}

export const PUSH_TEMPLATES = [
    {
        key: 'wellness',
        label: 'Wellness sleva',
        title: 'Wellness večer −15 %',
        body: 'Dnes 18–22 h platí sleva na masáže. Rezervujte si termín přímo v aplikaci.',
        severity: 'info',
    },
    {
        key: 'breakfast',
        label: 'Snídaně',
        title: 'Snídaně se prodlužuje',
        body: 'Dnes servírujeme snídani až do 11:00. Přejeme příjemné ráno.',
        severity: 'info',
    },
    {
        key: 'vip',
        label: 'VIP welcome',
        title: 'Vítejte zpět, VIP hoste',
        body: 'Váš pokoj je připraven. Concierge vám kdykoli pomůže s čímkoli na pobytu.',
        severity: 'info',
    },
    {
        key: 'checkout',
        label: 'Checkout',
        title: 'Odjezd za 2 hodiny',
        body: 'Potřebujete pozdní checkout nebo taxi? Napište nám v aplikaci — zařídíme to hned.',
        severity: 'warning',
    },
    {
        key: 'emergency',
        label: 'Naléhavé',
        title: 'Technická odstávka vody',
        body: 'Dnes 14–16 h proběhne plánovaná údržba. Děkujeme za pochopení.',
        severity: 'critical',
    },
];
