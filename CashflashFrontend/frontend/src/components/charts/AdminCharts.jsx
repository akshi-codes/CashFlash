import {
  Label,
  Pie,
  PieChart,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function CenterText({
  viewBox,
  value,
  label,
  valueClassName = "fill-foreground text-2xl font-bold",
  labelClassName = "fill-muted-foreground text-xs",
  valueYOffset = 0,
  labelYOffset = 18,
}) {
  if (
    !viewBox ||
    typeof viewBox.cx !== "number" ||
    typeof viewBox.cy !== "number"
  ) {
    return null;
  }

  return (
    <text
      x={viewBox.cx}
      y={viewBox.cy}
      textAnchor="middle"
      dominantBaseline="middle"
    >
      <tspan
        x={viewBox.cx}
        y={viewBox.cy + valueYOffset}
        className={valueClassName}
      >
        {value}
      </tspan>
      <tspan
        x={viewBox.cx}
        y={viewBox.cy + labelYOffset}
        className={labelClassName}
      >
        {label}
      </tspan>
    </text>
  );
}

export function TransactionStatusDonutChart({
  successfulCount = 0,
  pendingCount = 0,
  failedCount = 0,
  centerLabel = "Total",
  className = "",
}) {
  const success = Number(successfulCount) || 0;
  const pending = Number(pendingCount) || 0;
  const failed = Number(failedCount) || 0;
  const total = success + pending + failed;

  const hasData = total > 0;

  const chartData = hasData
    ? [
        {
          status: "successful",
          count: success,
          fill: "var(--color-successful)",
        },
        {
          status: "pending",
          count: pending,
          fill: "var(--color-pending)",
        },
        {
          status: "failed",
          count: failed,
          fill: "var(--color-failed)",
        },
      ].filter((item) => item.count > 0)
    : [{ status: "empty", count: 1, fill: "var(--muted)" }];

  const chartConfig = {
    count: {
      label: "Transactions",
    },
    successful: {
      label: "Successful",
      color: "#00FF00",
    },
    pending: {
      label: "Pending",
      color: "#FFD700",
    },
    failed: {
      label: "Failed",
      color: "#FF0000",
    },
  };

  const sharedTooltipContent = (
    <ChartTooltipContent
      hideLabel
      className="border-border bg-popover text-popover-foreground shadow-md"
    />
  );

  return (
    <div className={`w-37.5 h-25 shrink-0 ${className}`}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <PieChart margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
          <ChartTooltip
            offset={16}
            position={{ x: -80, y: -12 }}
            cursor={false}
            shared={false}
            content={sharedTooltipContent}
          />

          {hasData && (
            <ChartLegend
              verticalAlign="bottom"
              align="center"
              content={
                <ChartLegendContent
                  nameKey="status"
                  className="pt-0 gap-2 font-extralight pr-1"
                />
              }
            />
          )}

          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            innerRadius={30}
            outerRadius={40}
            cy="48%"
            stroke="var(--background)"
            strokeWidth={4}
          >
            <Label
              content={({ viewBox }) => (
                <CenterText
                  viewBox={viewBox}
                  value={total.toLocaleString()}
                  label={centerLabel}
                />
              )}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}

export function HttpTrafficRadialChart({
  totalRequests = 0,
  success2xx = 0,
  client4xx = 0,
  server5xx = 0,
  others = 0,
  centerLabel = "Total",
  className = "",
}) {
  const ok2xx = Number(success2xx) || 0;
  const err4xx = Number(client4xx) || 0;
  const err5xx = Number(server5xx) || 0;
  const otherCount = Number(others) || 0;

  const displayedTotal = ok2xx + err4xx + err5xx + otherCount;
  const total = Number(totalRequests) || displayedTotal;
  const hasData = displayedTotal > 0;

  const chartData = hasData
    ? [
        {
          status: "ok2xx",
          count: ok2xx,
          fill: "var(--color-ok2xx)",
        },
        {
          status: "err4xx",
          count: err4xx,
          fill: "var(--color-err4xx)",
        },
        {
          status: "err5xx",
          count: err5xx,
          fill: "var(--color-err5xx)",
        },
        {
          status: "others",
          count: otherCount,
          fill: "var(--color-others)",
        },
      ].filter((item) => item.count > 0)
    : [{ status: "empty", count: 1, fill: "var(--muted)" }];

  const chartConfig = {
    ok2xx: {
      label: "200s",
      color: "#00FF00",
    },
    err4xx: {
      label: "400s",
      color: "#FFD700",
    },
    err5xx: {
      label: "500s",
      color: "#FF0000",
    },
    others: {
      label: "Others",
      color: "#6B7280",
    },
  };

  const legendPayload = [
    { value: chartConfig.ok2xx.label, type: "square", color: chartConfig.ok2xx.color, dataKey: "ok2xx" },
    { value: chartConfig.err4xx.label, type: "square", color: chartConfig.err4xx.color, dataKey: "err4xx" },
    { value: chartConfig.err5xx.label, type: "square", color: chartConfig.err5xx.color, dataKey: "err5xx" },
    { value: chartConfig.others.label, type: "square", color: chartConfig.others.color, dataKey: "others" },
  ];

  const sharedTooltipContent = (
    <ChartTooltipContent
      hideLabel
      className="border-border bg-popover text-popover-foreground shadow-md"
    />
  );

  return (
    <div className={`w-37.5 h-25 shrink-0 ${className}`}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <PieChart margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
          <ChartTooltip
            offset={15}
            position={{ x: -80, y: 0 }}
            cursor={false}
            isAnimationActive={false}
            wrapperStyle={{ transition: "none" }}
            content={sharedTooltipContent}
          />

          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            startAngle={180}
            endAngle={0}
            innerRadius={40}
            outerRadius={50}
            cy="78%"
            stroke="var(--background)"
            strokeWidth={4}
          >
            <Label
              content={({ viewBox }) => (
                <CenterText
                  viewBox={viewBox}
                  value={total.toLocaleString()}
                  label={centerLabel}
                  valueClassName="fill-foreground text-2xl font-bold"
                  labelClassName="fill-muted-foreground text-[13px]"
                  valueYOffset={-10}
                  labelYOffset={10}
                />
              )}
            />
          </Pie>

          {hasData && (
            <ChartLegend
              verticalAlign="bottom"
              align="center"
              payload={legendPayload}
              content={
                <ChartLegendContent className="pt-0 gap-2 font-extralight pr-1" />
              }
            />
          )}
        </PieChart>
      </ChartContainer>
    </div>
  );
}
