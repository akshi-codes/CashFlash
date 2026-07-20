import { XIcon, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function ProfileInfoCard({ open, onClose, user }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-background/95 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-blue-500/10" />

        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 text-red-600 hover:bg-red-500 hover:text-white"
        >
          <XIcon className="h-5 w-5" />
        </Button>

        <div className="relative mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="mt-6 flex  justify-center sm:justify-start">
            <div className="h-77 w-77  rounded-[224px] p-1 ring-6 shadow-lg ring-foreground">
              <Avatar className="h-75 w-75 rounded-[224px] ring-2 ring-white/10">
                <AvatarImage
                  src={user?.profileImageUrl || "/avatar.png"}
                  alt={user?.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-[24px] bg-muted text-lg font-bold">
                  CF
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="grid flex-1 gap-4">
            <div className="space-y-1">
              <h2 className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-xl font-bold text-transparent">
                Profile Information
              </h2>
              <p className="text-sm text-muted-foreground">
                My personal details
              </p>
            </div>

            <div className="grid gap-3">
              <div className="group rounded-2xl border border-white/10 bg-muted/40 p-3 shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-muted/60 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Full Name
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {user?.fullName || "N/A"}
                </p>
              </div>

              <div className="group rounded-2xl border border-white/10 bg-muted/40 p-3 shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-muted/60 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                </div>
                <p className="break-all text-sm font-semibold text-foreground">
                  {user?.email || "N/A"}
                </p>
              </div>

              <div className="group rounded-2xl border border-white/10 bg-muted/40 p-3 shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-muted/60 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Phone Number
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {user?.phoneNumber || "N/A"}
                </p>
              </div>

              <div className="group rounded-2xl border border-white/10 bg-muted/40 p-3 shadow-sm transition-all duration-200 hover:border-primary/20 hover:bg-muted/60 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Role
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {user?.role
                    ? user.role.charAt(0).toUpperCase() +
                      user.role.slice(1).toLowerCase()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
