'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { HeatmapData } from '@/lib/stats-transform';

// Dynamically import ActivityCalendar to avoid SSR issues
const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then((mod) => mod.ActivityCalendar),
  { ssr: false }
);

interface WritingHeatmapProps {
  data: HeatmapData;
}

export default function WritingHeatmap({ data }: WritingHeatmapProps) {
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
      <h4 className="text-base font-semibold text-text mb-4">寫作日曆</h4>
      <div className="overflow-x-auto -mx-1">
        <ActivityCalendar
          data={data}
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
