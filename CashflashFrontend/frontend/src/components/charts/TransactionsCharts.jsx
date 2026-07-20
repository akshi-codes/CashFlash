import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useIsMobile } from "@/hooks/useMobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartData = [
  { date: "2024-04-02", walletPayments: 1180, otherPayments: 140 },
  { date: "2024-04-05", walletPayments: 940, otherPayments: 60 },
  { date: "2024-04-08", walletPayments: 220, otherPayments: 1190 },
  { date: "2024-04-11", walletPayments: 510, otherPayments: 90 },
  { date: "2024-04-14", walletPayments: 190, otherPayments: 170 },
  { date: "2024-04-17", walletPayments: 420, otherPayments: 260 },
  { date: "2024-04-20", walletPayments: 260, otherPayments: 120 },
  { date: "2024-04-23", walletPayments: 180, otherPayments: 310 },
  { date: "2024-04-26", walletPayments: 1520, otherPayments: 780 },
  { date: "2024-04-29", walletPayments: 230, otherPayments: 290 },

  { date: "2024-05-02", walletPayments: 780, otherPayments: 210 },
  { date: "2024-05-05", walletPayments: 310, otherPayments: 350 },
  { date: "2024-05-08", walletPayments: 920, otherPayments: 980 },
  { date: "2024-05-11", walletPayments: 260, otherPayments: 420 },
  { date: "2024-05-14", walletPayments: 430, otherPayments: 240 },
  { date: "2024-05-17", walletPayments: 1150, otherPayments: 510 },
  { date: "2024-05-20", walletPayments: 290, otherPayments: 1160 },
  { date: "2024-05-23", walletPayments: 670, otherPayments: 480 },
  { date: "2024-05-26", walletPayments: 240, otherPayments: 200 },
  { date: "2024-05-29", walletPayments: 980, otherPayments: 560 },

  { date: "2024-06-01", walletPayments: 360, otherPayments: 190 },
  { date: "2024-06-03", walletPayments: 840, otherPayments: 460 },
  { date: "2024-06-05", walletPayments: 410, otherPayments: 880 },
  { date: "2024-06-07", walletPayments: 1220, otherPayments: 1620 },
  { date: "2024-06-09", walletPayments: 390, otherPayments: 340 },
  { date: "2024-06-21", walletPayments: 730, otherPayments: 1540 },
  { date: "2024-06-23", walletPayments: 260, otherPayments: 300 },
  { date: "2024-06-25", walletPayments: 980, otherPayments: 670 },
  { date: "2024-06-27", walletPayments: 430, otherPayments: 410 },
  { date: "2024-06-29", walletPayments: 1350, otherPayments: 720 },
]

const chartConfig = {
  payments: {
    label: "Payments",
  },
  walletPayments: {
    label: "Wallet Payments",
    color: "hsl(var(--chart-1))",
  },
  otherPayments: {
    label: "Other Payments",
    color: "hsl(var(--chart-2))",
  },
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90

    if (timeRange === "30d") daysToSubtract = 30
    if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Total Payments</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Payment activity for the selected period
          </span>
          <span className="@[540px]/card:hidden">Payments overview</span>
        </CardDescription>

        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="@[767px]/card:hidden flex w-40">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillWallet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-walletPayments)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--color-walletPayments)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillCard" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-otherPayments)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-otherPayments)" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
              }
            />

            <Area
              dataKey="otherPayments"
              type="natural"
              fill="url(#fillCard)"
              stroke="var(--color-otherPayments)"
              stackId="a"
            />
            <Area
              dataKey="walletPayments"
              type="natural"
              fill="url(#fillWallet)"
              stroke="var(--color-walletPayments)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
