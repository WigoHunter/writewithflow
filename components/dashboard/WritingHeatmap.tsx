'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { HeatmapData } from '@/lib/stats-transform';

// Dynamically import ActivityCalendar to avoid SSR issues
const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.ActivityCalendar),
  { ssr: false }
);

type DateRange = 'year' | '6months' | '3months' | '1month';

const currentYear = new Date().getFullYear();

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'year', label: `${currentYear}` },
  { value: '6months', label: '過去 6 個月' },
  { value: '3months', label: '過去 3 個月' },
  { value: '1month', label: '過去 1 個月' },
];

interface WritingHeatmapProps {
  data: HeatmapData;
}

export default function WritingHeatmap({ data }: WritingHeatmapProps) {
  const [dateRange, setDateRange] = useState<DateRange>('year');

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const today = new Date();
    const year = today.getFullYear();
    let startDateStr: string;
    let endDateStr: string;

    if (dateRange === 'year') {
      // Current year: 1/1 to 12/31
      startDateStr = `${year}-01-01`;
      endDateStr = `${year}-12-31`;
    } else {
      // Past X months: from startDate to today
      const daysToSubtract = dateRange === '6months' ? 180 : dateRange === '3months' ? 90 : 30;
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToSubtract);
      startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      endDateStr = `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    // Filter data within range
    const filtered = data.filter(item => item.date >= startDateStr && item.date <= endDateStr);

    // Ensure start and end dates exist to set the calendar range
    // (react-activity-calendar uses first/last entries to determine range)
    const hasStartDate = filtered.some(item => item.date === startDateStr);
    const hasEndDate = filtered.some(item => item.date === endDateStr);

    const result = [...filtered];
    if (!hasStartDate) {
      result.unshift({ date: startDateStr, count: 0, level: 0 });
    }
    if (!hasEndDate) {
      result.push({ date: endDateStr, count: 0, level: 0 });
    }

    return result;
  }, [data, dateRange]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border p-4">
        <h4 className="text-base font-semibold text-text mb-3">寫作日曆</h4>
        <p className="text-xs text-text/50 font-sans">還沒有寫作記錄</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-text">寫作日曆</h4>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="text-xs text-text/70 bg-transparent border border-border rounded px-2 py-1 font-sans focus:outline-none focus:border-primary/50"
        >
          {DATE_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto -mx-1">
        <ActivityCalendar
          data={filteredData}
          theme={{
            light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
            dark: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
          }}
          weekStart={1}
          showWeekdayLabels={false}
          showColorLegend={false}
          showTotalCount={false}
          blockSize={9}
          blockMargin={2}
          fontSize={10}
          renderBlock={(block, activity) =>
            React.cloneElement(block, {
              'data-tooltip-id': 'activity-tooltip',
              'data-tooltip-content': `${activity.date}: ${activity.count} 字`,
            })
          }
        />
      </div>
      <Tooltip id="activity-tooltip" />
    </div>
  );
}
