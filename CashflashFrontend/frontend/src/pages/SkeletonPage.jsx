import { AppSidebar } from "@/components/layout/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SkeletonPage() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 56)",
        "--header-height": "calc(var(--spacing) * 16)",
      }}
    >
      <AppSidebar className="z-50" />

      <SidebarInset>
        <div className="fixed top-4 right-4 mt-3 z-50 flex items-center gap-2 rounded-md">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 hidden sm:block"
          />

          <Skeleton className="h-10 w-10 rounded-md" />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 hidden sm:block"
          />

          <Skeleton className="h-10 w-10 rounded-md" />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 hidden sm:block"
          />

          <Skeleton className="h-10 w-10 rounded-md" />
        </div>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 pt-7 flex h-16 items-center gap-2 px-4 bg-background/60 backdrop-blur supports-backdrop-filter:bg-background/40">
            <SidebarTrigger className="opacity-50 pointer-events-none" />

            <Badge
              variant="outline"
              className="ml-3 py-1 opacity-50 pointer-events-none"
            >
              <Skeleton className="h-4 w-20" />
            </Badge>
          </header>

          <div className="@container/main flex flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-10 p-4 pt-4 md:pt-6 lg:px-6">
              <div className="grid gap-10 grid-cols-1 md:grid-cols-3">
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
              </div>

              <div className="grid gap-10 grid-cols-1 lg:grid-cols-2">
                <Skeleton className="h-95 rounded-xl" />
                <Skeleton className="h-95 rounded-xl" />
              </div>

              <ScrollArea className="h-50 rounded-md border">
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-40" />
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </ScrollArea>

              <div className="bg-muted/50 flex-1 rounded-xl p-4">
                <Skeleton className="h-6 w-44 mb-4" />
                <Skeleton className="h-80 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function QrDisplayCardSkeleton() {
  return (
    <div className="w-120 max-w-[90%] h-125 rounded-2xl border bg-card p-6 shadow-xl relative animate-in scale-in duration-200 flex flex-col items-center justify-center">
      <Skeleton className="h-5 w-32 mb-8" />

      <Skeleton className="w-72 h-72 rounded-lg mb-2" />

      <Skeleton className="h-6 w-44 mt-12" />
    </div>
  );
}
