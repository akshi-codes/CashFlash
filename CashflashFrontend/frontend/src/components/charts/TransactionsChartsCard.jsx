import { Button } from "@/components/ui/button";
import { X, ChartNoAxesCombined } from "lucide-react";
import { ChartAreaInteractive } from "./TransactionsCharts";

export default function ChartAreaCard({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm p-4">
      <div
        className="relative w-[95vw] max-w-7xl rounded-2xl border bg-card p-4 shadow-xl animate-in scale-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex items-center gap-2 mb-4 pr-12">
          <ChartNoAxesCombined className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Spending Behaviour</h2>
        </div>

        <ChartAreaInteractive />
      </div>
    </div>
  );
}
