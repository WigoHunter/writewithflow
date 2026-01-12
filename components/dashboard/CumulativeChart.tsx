'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CumulativeChartData, formatDateShort } from '@/lib/stats-transform';

interface CumulativeChartProps {
  data: CumulativeChartData;
}

export default function CumulativeChart({ data }: CumulativeChartProps) {
  // 格式化資料供圖表使用
  const chartData = data.map(item => ({
    date: formatDateShort(item.date),
    fullDate: item.date,
    累計字數: item.cumulative,
    當日字數: item.daily,
  }));

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border p-4">
        <h4 className="text-base font-semibold text-text mb-3">累計趨勢</h4>
        <p className="text-xs text-text/50 font-sans">還沒有寫作記錄</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <h4 className="text-base font-semibold text-text mb-4">累計趨勢</h4>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#999"
            fontSize={10}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#999"
            fontSize={10}
            tickLine={false}
            width={40}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}k`;
              }
              return value.toString();
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px',
              padding: '6px 8px',
            }}
            formatter={(value: any) => [value.toLocaleString() + ' 字', '']}
            labelFormatter={(label: any, payload: any) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullDate;
              }
              return label;
            }}
          />
          <Line
            type="monotone"
            dataKey="累計字數"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
