"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { HomeTrendPoint } from "@/src/api/home";

const chartConfig = {
  showcases: {
    label: "Showcases",
    color: "var(--color-primary)",
  },
  submissions: {
    label: "Submissions",
    color: "var(--color-chart-2)",
  },
  voted: {
    label: "Voted",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

export function DashboardTrendChart({ data }: { data: HomeTrendPoint[] }) {
  const [activeSeries, setActiveSeries] = useState<string | null>(null);

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 12, top: 12 }}>
        <defs>
          <linearGradient id="showcases-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-showcases)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-showcases)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="submissions-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-submissions)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-submissions)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="voted-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-voted)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-voted)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent onItemHover={setActiveSeries} />} />
        <Area
          dataKey="showcases"
          type="linear"
          fill="url(#showcases-fill)"
          fillOpacity={1}
          stroke="var(--color-showcases)"
          strokeWidth={2}
          opacity={activeSeries && activeSeries !== "showcases" ? 0.25 : 1}
          dot={false}
        />
        <Area
          dataKey="submissions"
          type="linear"
          fill="url(#submissions-fill)"
          fillOpacity={1}
          stroke="var(--color-submissions)"
          strokeWidth={2}
          opacity={activeSeries && activeSeries !== "submissions" ? 0.25 : 1}
          dot={false}
        />
        <Area
          dataKey="voted"
          type="linear"
          fill="url(#voted-fill)"
          fillOpacity={1}
          stroke="var(--color-voted)"
          strokeWidth={2}
          opacity={activeSeries && activeSeries !== "voted" ? 0.25 : 1}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}