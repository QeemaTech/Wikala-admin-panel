'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { formatNumber } from '@/lib/i18n/format';

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
}

export function Donut({ slices, size = 160, thickness = 26 }: DonutProps) {
  const total = slices.reduce((s, c) => s + c.value, 0);
  const innerRadius = (size / 2) - thickness;

  return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={size / 2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {slices.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
              <Label
                position="center"
                content={({ viewBox }) => {
                  const cx = (viewBox as { cx: number; cy: number }).cx;
                  const cy = (viewBox as { cx: number; cy: number }).cy;
                  return (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={cx} dy="-0.3em" style={{ fontSize: 18, fontWeight: 700, fill: '#1e293b', fontFamily: 'var(--font-mono)' }}>
                        {formatNumber(total)}
                      </tspan>
                      <tspan x={cx} dy="1.4em" style={{ fontSize: 10, fill: '#8a98ac' }}>
                        الإجمالي
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e5eaf1', fontSize: 12 }}
              formatter={(v: number, _key: string, props: { payload?: DonutSlice }) => [
                formatNumber(v),
                props.payload?.name ?? '',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full space-y-1.5">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-ink-2">{s.name}</span>
            </div>
            <span className="font-mono font-medium text-ink">{formatNumber(s.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border pt-1.5 text-[12px]">
          <span className="font-medium text-muted">الإجمالي</span>
          <span className="font-mono font-bold text-ink">{formatNumber(total)}</span>
        </div>
      </div>
    </div>
  );
}
