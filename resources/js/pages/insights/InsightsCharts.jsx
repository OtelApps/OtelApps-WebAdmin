import React from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { CHART_COLORS, axisStyle, chartTooltipStyle, gridStyle } from './insightsTheme';
import { EmptyChart } from './InsightsShell';
import { formatMoney } from '../../utils/formatMoney';

export function TimelineAreaChart({ data, valueKey = 'value', height = 280, formatValue }) {
    if (!data?.length || data.every((d) => !d[valueKey])) {
        return <EmptyChart />;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} vertical={false} />
                <XAxis dataKey="label" {...axisStyle} tickLine={false} />
                <YAxis {...axisStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                    {...chartTooltipStyle}
                    formatter={(v) => [formatValue ? formatValue(v) : v, '']}
                    labelFormatter={(label) => label}
                />
                <Area
                    type="monotone"
                    dataKey={valueKey}
                    stroke={CHART_COLORS[0]}
                    strokeWidth={2.5}
                    fill="url(#areaFill)"
                    dot={false}
                    activeDot={{ r: 5, fill: CHART_COLORS[0] }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function RevenueTimelineChart({ data, currency = 'CZK', height = 280 }) {
    return (
        <TimelineAreaChart
            data={data}
            height={height}
            formatValue={(v) => formatMoney(v, currency)}
        />
    );
}

export function HorizontalBarChart({ data, dataKey = 'count', nameKey = 'label', height = 280 }) {
    if (!data?.length) {
        return <EmptyChart />;
    }

    const chartData = [...data].reverse();

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid {...gridStyle} horizontal={false} />
                <XAxis type="number" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis
                    type="category"
                    dataKey={nameKey}
                    {...axisStyle}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey={dataKey} radius={[0, 8, 8, 0]} maxBarSize={28}>
                    {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function GroupedBarChart({
    data,
    leftKey = 'claimed',
    rightKey = 'completed',
    leftName = 'Převzaté',
    rightName = 'Dokončené',
    nameKey = 'label',
    height = 280,
}) {
    if (!data?.length) {
        return <EmptyChart />;
    }

    const chartData = [...data].reverse();

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid {...gridStyle} horizontal={false} />
                <XAxis type="number" {...axisStyle} tickLine={false} axisLine={false} />
                <YAxis
                    type="category"
                    dataKey={nameKey}
                    {...axisStyle}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                />
                <Tooltip {...chartTooltipStyle} />
                <Legend
                    verticalAlign="bottom"
                    height={32}
                    formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>}
                />
                <Bar dataKey={leftKey} name={leftName} fill={CHART_COLORS[1]} radius={[0, 6, 6, 0]} maxBarSize={14} />
                <Bar dataKey={rightKey} name={rightName} fill={CHART_COLORS[0]} radius={[0, 6, 6, 0]} maxBarSize={14} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function DonutChart({ data, nameKey = 'label', valueKey = 'count', height = 280 }) {
    if (!data?.length) {
        return <EmptyChart />;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey={valueKey}
                    nameKey={nameKey}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={3}
                    stroke="none"
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function VerticalBarChart({ data, dataKey = 'count', nameKey = 'label', height = 280 }) {
    if (!data?.length) {
        return <EmptyChart />;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridStyle} vertical={false} />
                <XAxis dataKey={nameKey} {...axisStyle} tickLine={false} />
                <YAxis {...axisStyle} tickLine={false} axisLine={false} width={36} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {data.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function PeakHoursChart({ data, height = 280 }) {
    if (!data?.length) {
        return <EmptyChart />;
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...gridStyle} vertical={false} />
                <XAxis
                    dataKey="label"
                    {...axisStyle}
                    tickLine={false}
                    interval={2}
                />
                <YAxis {...axisStyle} tickLine={false} axisLine={false} width={32} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={20}>
                    {data.map((entry, i) => (
                        <Cell
                            key={i}
                            fill={entry.count > 0 ? CHART_COLORS[0] : '#e2e8f0'}
                            fillOpacity={entry.count > 0 ? 0.4 + (entry.count / Math.max(...data.map((d) => d.count), 1)) * 0.6 : 0.3}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function FunnelChart({ data, height = 280 }) {
    if (!data?.length) {
        return <EmptyChart message="Žádné požadavky ve funnelu." />;
    }

    const max = Math.max(...data.map((d) => d.count));

    return (
        <div className="space-y-3" style={{ minHeight: height }}>
            {data.map((step, i) => {
                const width = max > 0 ? Math.max(12, (step.count / max) * 100) : 12;
                return (
                    <div key={step.status} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-gray-500 dark:text-gray-400 text-right">
                            {step.label}
                        </span>
                        <div className="flex-1 h-9 bg-gray-100 dark:bg-gray-600/50 rounded-xl overflow-hidden">
                            <div
                                className="h-full rounded-xl flex items-center px-3 text-xs font-semibold text-white transition-all duration-500"
                                style={{
                                    width: `${width}%`,
                                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                                    minWidth: step.count > 0 ? '3rem' : 0,
                                }}
                            >
                                {step.count}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
