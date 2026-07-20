import { useEffect, useMemo, useState } from "react";
import { adminOverviewApi } from "../services/admin.services";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MonitorCloud, Pencil, RefreshCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TransactionStatusDonutChart,
  HttpTrafficRadialChart,
} from "@/components/charts/AdminCharts";
import CountUp from "@/components/shared/CountUp";
import AdminUsersTableCard from "./AllUsersCard";

function AnimatedMetric({
  value,
  type = "number",
  className = "count-up-text",
}) {
  if (value === null || value === undefined) return "—";

  const num = Number(value);

  if (Number.isNaN(num)) return "—";

  let to = num;
  let prefix = "";
  let suffix = "";

  switch (type) {
    case "currency":
      prefix = "₹ ";
      to = Number(num.toFixed(2));
      break;

    case "percent":
      to = Number((num * 100).toFixed(1));
      suffix = " %";
      break;

    case "ms":
      if (num >= 1000) {
        to = Number((num / 1000).toFixed(2));
        suffix = " s";
      } else {
        to = Number(num.toFixed(1));
        suffix = " ms";
      }
      break;

    case "bytes": {
      const gb = num / 1024 ** 3;
      const mb = num / 1024 ** 2;

      if (gb >= 1) {
        to = Number(gb.toFixed(2));
        suffix = " GB";
      } else {
        to = Number(mb.toFixed(1));
        suffix = " MB";
      }
      break;
    }

    case "minutes":
      to = Math.max(0, Math.floor(num / 60));
      suffix = " min";
      break;

    case "seconds":
      to = Math.max(0, Math.floor(num));
      suffix = " s";
      break;

    default:
      to = Number(num.toFixed(Number.isInteger(num) ? 0 : 2));
      break;
  }

  return (
    <>
      {prefix}
      <CountUp
        from={0}
        to={to}
        separator=","
        direction="up"
        duration={1}
        className={className}
      />
      {suffix}
    </>
  );
}

function StatTile({
  label,
  value,
  valuePrefix = "",
  valueSuffix = "",
  valueType = "number",
  subLabel,
  subValue,
  subValuePrefix = "",
  subValueSuffix = "",
  subValueType = "number",
  subContent,
  children,
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm tile-glow">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground">{label}</div>

          <div className="mt-1 pt-4 text-2xl font-semibold tracking-tight">
            {value === null || value === undefined ? (
              "—"
            ) : (
              <>
                {valuePrefix}
                <AnimatedMetric value={value} type={valueType} />
                {valueSuffix}
              </>
            )}
          </div>

          {subContent ? (
            <div className="mt-2 text-xs text-muted-foreground">
              {subContent}
            </div>
          ) : subLabel || subValue !== undefined ? (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="mr-1">{subLabel}</span>
              <span className="font-medium text-foreground/80">
                {subValue === null || subValue === undefined ? (
                  "—"
                ) : (
                  <>
                    {subValuePrefix}
                    <AnimatedMetric value={subValue} type={subValueType} />
                    {subValueSuffix}
                  </>
                )}
              </span>
            </div>
          ) : null}
        </div>

        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </div>
  );
}

function SquareTile({
  label,
  value,
  valuePrefix = "",
  valueSuffix = "",
  valueType = "number",
  hint,
  labelRight,
  valueRight,
  valueRightPrefix = "",
  valueRightSuffix = "",
  valueRightType = "number",
  action,
}) {
  return (
    <div className="aspect-auto rounded-xl border bg-card p-4 shadow-sm tile-glow flex flex-col justify-between">
      <div>
        <div className="h-5 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">{label}</div>

          <div className="flex items-center gap-2">
            {labelRight ? (
              <div className="text-sm text-muted-foreground">{labelRight}</div>
            ) : null}

            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4">
          <div className="text-2xl font-semibold tracking-tight">
            {value === null || value === undefined ? (
              "—"
            ) : (
              <>
                {valuePrefix}
                <AnimatedMetric value={value} type={valueType} />
                {valueSuffix}
              </>
            )}
          </div>

          {valueRight !== null && valueRight !== undefined ? (
            <div className="mt-2 shrink-0 text-lg font-semibold tracking-tight">
              {valueRightPrefix}
              <AnimatedMetric value={valueRight} type={valueRightType} />
              {valueRightSuffix}
            </div>
          ) : null}
        </div>

        {hint ? (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminOverviewCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showUsersTable, setShowUsersTable] = useState(false);

  const fetchOverview = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await adminOverviewApi();
      setData(res.data);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load admin overview.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const server = useMemo(() => {
    if (!data) return null;
    return data.serverStatsResponse || data.server || null;
  }, [data]);

  const httpOthers = useMemo(() => {
    const total = Number(server?.httpRequestsTotal) || 0;
    const ok2xx = Number(server?.http2xx) || 0;
    const err4xx = Number(server?.http4xx) || 0;
    const err5xx = Number(server?.http5xx) || 0;

    return Math.max(0, total - ok2xx - err4xx - err5xx);
  }, [server]);

  if (loading) {
    return (
      <Card className="rounded-2xl card-glow">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MonitorCloud className="h-5 w-5" />
            <span className="text-md font-medium">Statistical Overview</span>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl card-glow">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MonitorCloud className="h-5 w-5" />
            <span className="text-md font-medium">Statistical Overview</span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={fetchOverview}
                  className="h-8 w-8"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Refresh</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>

        <CardContent className="space-y-8">
          {err ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              {err}
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SquareTile
                label="Total Users"
                value={data?.totalUsers}
                valueType="number"
                action={
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setShowUsersTable(true)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>View all users</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                }
              />

              <SquareTile
                label="Total Merchants"
                value={data?.totalMerchants}
                valueType="number"
              />

              <SquareTile
                label="Total Transactions"
                value={data?.totalTransactions}
                valueType="number"
              />

              <SquareTile
                label="Total Amount"
                value= {data?.totalAmount}
                valueType="currency"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <StatTile
                label="Transaction Health"
                value={data?.successfulTransactions}
                valueType="number"
                valueSuffix=" successful"
                subContent={
                  <>
                    <span className="mr-1">Pending:</span>
                    <span className="font-medium text-foreground/80">
                      <AnimatedMetric
                        value={data?.pendingTransactions}
                        type="number"
                      />
                    </span>
                    <span className="mx-2">|</span>
                    <span className="mr-1">Failed:</span>
                    <span className="font-medium text-foreground/80">
                      <AnimatedMetric
                        value={data?.failedTransactions}
                        type="number"
                      />
                    </span>
                  </>
                }
              >
                <TransactionStatusDonutChart
                  successfulCount={data?.successfulTransactions}
                  pendingCount={data?.pendingTransactions}
                  failedCount={data?.failedTransactions}
                  centerLabel="Total"
                />
              </StatTile>

              <StatTile
                label="Access & Uptime"
                value={data?.loginCount}
                valueType="number"
                valueSuffix=" logins"
                subLabel="Uptime:"
                subValue={data?.uptimeSeconds}
                subValueType="minutes"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <SquareTile
                label="Heap Used"
                value={server?.heapUsedBytes}
                valueType="bytes"
              />

              <SquareTile
                label="Heap Max"
                value={server?.heapMaxBytes}
                valueType="bytes"
              />

              <SquareTile
                label="Avg Latency"
                value={server?.httpAvgMs}
                valueType="ms"
              />

              <SquareTile
                label="Max Latency"
                value={server?.httpMaxMs}
                valueType="ms"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <StatTile
                label="CPU Usage"
                value={server?.processCpuUsage}
                valuePrefix="Process: "
                valueType="percent"
                subLabel="System:"
                subValue={server?.systemCpuUsage}
                subValueType="percent"
              />

              <StatTile
                label="HTTP Traffic"
                value={server?.httpRequestsTotal}
                valueType="number"
                valueSuffix=" total requests"
                subContent={
                  <>
                    <span className="mr-1">200s:</span>
                    <span className="font-medium text-foreground/80">
                      <AnimatedMetric value={server?.http2xx} type="number" />
                    </span>
                    <span className="mx-2">|</span>
                    <span className="mr-1">400s:</span>
                    <span className="font-medium text-foreground/80">
                      <AnimatedMetric value={server?.http4xx} type="number" />
                    </span>
                    <span className="mx-2">|</span>
                    <span className="mr-1">500s:</span>
                    <span className="font-medium text-foreground/80">
                      <AnimatedMetric value={server?.http5xx} type="number" />
                    </span>
                    <span className="mx-2">|</span>
                    <span className="mr-1">Others:</span>
                    <span className="font-medium text-foreground/80">
                      <AnimatedMetric value={httpOthers} type="number" />
                    </span>
                  </>
                }
              >
                <HttpTrafficRadialChart
                  totalRequests={server?.httpRequestsTotal}
                  success2xx={server?.http2xx}
                  client4xx={server?.http4xx}
                  server5xx={server?.http5xx}
                  others={httpOthers}
                  centerLabel="Total"
                />
              </StatTile>
            </div>
          </div>
        </CardContent>
      </Card>

      {showUsersTable && (
        <AdminUsersTableCard onClose={() => setShowUsersTable(false)} />
      )}
    </>
  );
}