"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LoopStats } from "@/lib/types";
import { PanelCard } from "./PanelCard";

const fmtDay = (d: string) => {
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

const prettyTool = (tool: string) => tool.replace(/_/g, " ");

function Delta({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="text-text-muted text-xs flex items-center gap-0.5">
        <Minus size={12} />0
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="text-accent text-xs flex items-center gap-0.5">
        <ArrowUp size={12} />+{value}
      </span>
    );
  }
  return (
    <span className="text-rose-400 text-xs flex items-center gap-0.5">
      <ArrowDown size={12} />
      {value}
    </span>
  );
}

export function LoopPanel({ loop }: { loop: LoopStats }) {
  const t = useTranslations("analytics.loop");

  const isEmpty =
    loop.messagesSent === 0 &&
    loop.connectorInteractions === 0 &&
    loop.actionsTaken === 0;

  if (isEmpty) {
    return (
      <PanelCard
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<Sparkles size={16} className="text-accent-2" />}
      >
        <div className="text-sm text-text-muted py-4">{t("empty")}</div>
      </PanelCard>
    );
  }

  const messagesLabel = t("chartMessages");
  const deepLabel = t("chartDeep");
  const chartData = loop.daily.map((p) => ({
    label: fmtDay(p.day),
    [messagesLabel]: p.messages,
    [deepLabel]: p.deepMessages,
  }));
  const tickEvery = Math.max(1, Math.ceil(chartData.length / 12));
  const hasDeep = loop.deepMessages > 0;

  const tiles = [
    {
      label: t("messages"),
      value: loop.messagesSent,
      delta: loop.messagesDeltaVsPrev,
      caption: hasDeep ? t("inclDeep", { count: loop.deepMessages }) : undefined,
    },
    { label: t("conversations"), value: loop.conversations },
    { label: t("actions"), value: loop.actionsTaken },
    { label: t("activeDays"), value: loop.activeDays },
  ];

  const surfaceTotal = loop.messagesSent + loop.connectorInteractions;

  return (
    <PanelCard
      title={t("title")}
      subtitle={t("subtitle")}
      icon={<Sparkles size={16} className="text-accent-2" />}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="bg-bg/50 border border-border rounded-lg p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xl font-semibold text-text tabular-nums">
                {tile.value}
              </div>
              {typeof tile.delta === "number" ? <Delta value={tile.delta} /> : null}
            </div>
            <div className="text-xs text-text-muted mt-1">{tile.label}</div>
            {tile.caption ? (
              <div className="text-[11px] text-text-muted mt-0.5">
                {tile.caption}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {chartData.length > 1 ? (
        <div className="h-48 -mx-2 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
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
              {hasDeep ? (
                <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
              ) : null}
              <Line
                type="monotone"
                dataKey={messagesLabel}
                stroke="#c084fc"
                strokeWidth={2}
                dot={false}
              />
              {hasDeep ? (
                <Line
                  type="monotone"
                  dataKey={deepLabel}
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        {/* Top actions Loop performed */}
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted mb-2">
            {t("topTools")}
          </div>
          {loop.topTools.length === 0 ? (
            <div className="text-sm text-text-muted py-2">{t("topToolsEmpty")}</div>
          ) : (
            <ul className="space-y-2">
              {loop.topTools.map((row) => (
                <li
                  key={row.tool}
                  className="flex items-center justify-between gap-3 bg-bg/50 border border-border rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-text truncate capitalize">
                    {prettyTool(row.tool)}
                  </span>
                  <span className="text-base font-semibold text-text tabular-nums shrink-0">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Surfaces: in-app vs Claude connector */}
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted mb-2">
            {t("surfaces")}
          </div>
          <div className="space-y-3">
            {[
              { label: t("inApp"), value: loop.messagesSent, color: "#c084fc" },
              {
                label: t("connector"),
                value: loop.connectorInteractions,
                color: "#60a5fa",
              },
            ].map((s) => {
              const pct =
                surfaceTotal > 0 ? (s.value / surfaceTotal) * 100 : 0;
              return (
                <div key={s.label}>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <MessageSquare size={12} className="text-text-muted" />
                    <span className="text-text-muted flex-1">{s.label}</span>
                    <span className="text-text tabular-nums">{s.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                      className="h-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
