export const parseTextHours = (rows) => {
    return rows.map(row => {
        let startTime = '';
        let endTime = '';
        let open24h = false;
        let closed = false;
        const text = (row.hours_text || '').toLowerCase().trim();
        
        if (text === 'zavřeno' || text === 'closed') {
            closed = true;
        } else if (text === '24/7' || text === 'nonstop' || text === 'open 24h') {
            open24h = true;
        } else if (text.includes('-')) {
            const parts = text.split('-');
            startTime = parts[0].trim();
            endTime = parts[1].trim();
        }

        return {
            day_order: row.day_order,
            day: row.day_name,
            enabled: true,
            startTime,
            endTime,
            open24h,
            closed,
            originalText: row.hours_text // preserve fallback
        };
    });
};

export const formatTextHours = (days) => {
    return days.map(day => {
        let text = '';
        if (day.closed) text = 'Zavřeno';
        else if (day.open24h) text = '24/7';
        else if (day.startTime && day.endTime) text = `${day.startTime} - ${day.endTime}`;
        else text = day.originalText || ''; // fallback if disabled or empty
        
        return {
            day_order: day.day_order,
            day_name: day.day,
            hours_text: text
        };
    });
};
