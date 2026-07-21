import React from 'react';

/**
 * Indikátor, jestli má host otevřený chat v appce.
 * Online (v chatu): 👀, typing: ✍️, away: 💤.
 */
export function GuestPresenceBadge({ online, typing = false }) {
    const emoji = typing ? '✍️' : online ? '👀' : '💤';
    const label = typing ? 'Host píše…' : online ? 'Host je v chatu' : 'Host není v chatu';

    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px]"
            title={label}
            style={{
                backgroundColor: online || typing ? 'rgba(255, 159, 0, 0.15)' : 'rgba(156, 163, 175, 0.2)',
                opacity: online || typing ? 1 : 0.75,
            }}
        >
            <span
                aria-hidden
                className={`inline-block leading-none ${
                    typing ? 'animate-pulse' : online ? 'oa-eyes-look' : ''
                }`}
            >
                {emoji}
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-gray-600 sm:inline dark:text-gray-300">
                {typing ? 'píše' : online ? 'v chatu' : 'pryč'}
            </span>
            <EyesLookStyle />
        </span>
    );
}

/**
 * Ve vlákně: 👀 jen když je host opravdu v chatu a admin čeká;
 * když je pryč → 💤.
 */
export function WaitingForGuestEyes({ visible, guestOnline }) {
    if (!visible) return null;

    if (guestOnline) {
        return (
            <div className="flex justify-start pl-1" title="Host je v chatu — čekám na odpověď…">
                <span
                    className="oa-eyes-look inline-flex items-center justify-center rounded-2xl rounded-bl-md bg-orange-50 px-3 py-2 text-[22px] leading-none dark:bg-orange-950/40"
                    aria-label="Host je v chatu"
                >
                    👀
                </span>
                <EyesLookStyle />
            </div>
        );
    }

    return (
        <div className="flex justify-start pl-1" title="Host není v chatu">
            <span
                className="inline-flex items-center justify-center rounded-2xl rounded-bl-md bg-gray-100 px-3 py-2 text-[22px] leading-none opacity-80 dark:bg-gray-800"
                aria-label="Host není v chatu"
            >
                💤
            </span>
        </div>
    );
}

function EyesLookStyle() {
    return (
        <style>{`
            @keyframes oa-eyes-look {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-4px); }
                40% { transform: translateX(-4px); }
                60% { transform: translateX(4px); }
                80% { transform: translateX(4px); }
            }
            .oa-eyes-look {
                animation: oa-eyes-look 2.4s ease-in-out infinite;
                display: inline-block;
            }
        `}</style>
    );
}
