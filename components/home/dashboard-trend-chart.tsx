"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartData = [
  { month: "Jan", showcases: 18 },
  { month: "Feb", showcases: 24 },
  { month: "Mar", showcases: 21 },
  { month: "Apr", showcases: 32 },
  { month: "May", showcases: 29 },
  { month: "Jun", showcases: 41 },
];

const chartConfig = {
  showcases: {
    label: "Showcases",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export function DashboardTrendChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <AreaChart accessibilityLayer data={chartData} margin={{ left: 0, right: 12, top: 12 }}>
        <defs>
          <linearGradient id="showcases-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-showcases)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-showcases)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="showcases"
          type="natural"
          fill="url(#showcases-fill)"
          fillOpacity={1}
          stroke="var(--color-showcases)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}