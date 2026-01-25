'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { HeatmapData } from '@/lib/stats-transform';

const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.ActivityCalendar),
  { ssr: false }
);

interface ProfileHeatmapProps {
  data: HeatmapData;
}

export default function ProfileHeatmap({ data }: ProfileHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-text/50 font-sans">還沒有寫作記錄</p>
    );
  }

  // Current year: 1/1 to 12/31
  const year = new Date().getFullYear();
  const startDateStr = `${year}-01-01`;
  const endDateStr = `${year}-12-31`;

  // Filter data within range
  const filtered = data.filter(
    (item) => item.date >= startDateStr && item.date <= endDateStr
  );

  // Ensure start and end dates exist
  const hasStartDate = filtered.some((item) => item.date === startDateStr);
  const hasEndDate = filtered.some((item) => item.date === endDateStr);

  const result = [...filtered];
  if (!hasStartDate) {
    result.unshift({ date: startDateStr, count: 0, level: 0 });
  }
  if (!hasEndDate) {
    result.push({ date: endDateStr, count: 0, level: 0 });
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <ActivityCalendar
          data={result}
          theme={{
            light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
            dark: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
          }}
          weekStart={1}
          showWeekdayLabels={false}
          showTotalCount={false}
          showColorLegend={false}
          blockSize={10}
          blockMargin={3}
          fontSize={11}
          renderBlock={(block, activity) =>
            React.cloneElement(block, {
              'data-tooltip-id': 'profile-activity-tooltip',
              'data-tooltip-content': `${activity.date}: ${activity.count.toLocaleString()} 字`,
            })
          }
        />
      </div>
      <Tooltip id="profile-activity-tooltip" />
    </div>
  );
}
