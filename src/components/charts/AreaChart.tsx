'use client';

import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatNumber } from '@/lib/i18n/format';

interface AreaChartProps {
  labels: string[];
  values: number[];
  height?: number | string;
  color?: string;
  fill?: string;
  /** Tooltip series name (defaults to the dashboard's "إعلانات"). */
  tooltipLabel?: string;
  /** Formats both the Y-axis ticks and the tooltip value (defaults to grouped number). */
  valueFormatter?: (v: number) => string;
}

export function AreaChart({
  labels,
  values,
  height = 200,
  color = '#226199',
  fill = '#226199',
  tooltipLabel = 'إعلانات',
  valueFormatter = formatNumber,
}: AreaChartProps) {
  const data = labels.map((label, i) => ({ label, value: values[i] ?? 0 }));
  // Key on BOTH color and fill so two charts sharing a stroke color but a
  // different fill don't collide on the same <defs> gradient id.
  const fillId = `area-fill-${color.replace('#', '')}-${fill.replace('#', '')}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReAreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fill} stopOpacity={0.12} />
            <stop offset="95%" stopColor={fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#eef0f3" strokeDasharray="4 4" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#8a98ac', fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#8a98ac', fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5eaf1',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
          formatter={(v: number) => [valueFormatter(v), tooltipLabel]}
          labelStyle={{ color: '#3b4a60', marginBottom: 4 }}
        />
        <Area
          type="linear"
          dataKey="value"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`url(#${fillId})`}
          dot={{ r: 3, fill: '#fff', stroke: color, strokeWidth: 1.8 }}
          activeDot={{ r: 4.5, fill: color, strokeWidth: 0 }}
        />
      </ReAreaChart>
    </ResponsiveContainer>
  );
}
