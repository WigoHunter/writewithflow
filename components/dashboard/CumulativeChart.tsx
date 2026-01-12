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

  return (
    <div className="bg-white rounded-xl border-2 border-border p-8">
      <h3 className="text-xl font-bold text-text mb-6">累計字數</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            fontSize={12}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#666"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
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
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-text/60 font-sans">
        顯示過去寫作的累計字數趨勢
      </div>
    </div>
  );
}
