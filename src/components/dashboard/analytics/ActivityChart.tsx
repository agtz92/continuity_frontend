"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { LineChart as LineIcon } from "lucide-react";
import type { ActivityPoint } from "@/lib/types";
import { PanelCard } from "./PanelCard";

const fmtDay = (d: string) => {
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

export function ActivityChart({ series }: { series: ActivityPoint[] }) {
  // Sample at most ~60 ticks to keep the X-axis legible.
  const tickEvery = Math.max(1, Math.ceil(series.length / 12));
  const data = series.map((p) => ({
    day: p.day,
    label: fmtDay(p.day),
    Updates: p.updates,
    Tareas: p.completedTasks,
  }));

  return (
    <PanelCard
      title="Actividad por día"
      icon={<LineIcon size={16} className="text-emerald-400" />}
    >
      <div className="h-64 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              stroke="#71717a"
              fontSize={11}
              interval={tickEvery - 1}
              tickLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
            <Line
              type="monotone"
              dataKey="Updates"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Tareas"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </PanelCard>
  );
}
