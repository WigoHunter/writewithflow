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
      <div className="bg-white rounded-xl border-2 border-border p-8">
        <h3 className="text-xl font-bold text-text mb-6">寫作熱力圖</h3>
        <p className="text-text/60 font-sans">還沒有寫作記錄</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-border p-8">
      <h3 className="text-xl font-bold text-text mb-6">寫作熱力圖</h3>
      <div className="overflow-x-auto">
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
          blockSize={12}
          blockMargin={4}
          fontSize={14}
          renderBlock={(block, activity) =>
            React.cloneElement(block, {
              'data-tooltip-id': 'activity-tooltip',
              'data-tooltip-content': `${activity.count} 字`,
            })
          }
        />
      </div>
      <div className="mt-4 text-sm text-text/60 font-sans">
        將滑鼠移到方塊上查看當天字數
      </div>
      <Tooltip id="activity-tooltip" />
    </div>
  );
}
