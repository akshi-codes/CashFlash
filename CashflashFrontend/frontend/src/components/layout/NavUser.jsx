import { useState } from "react";
import {
  Bell,
  ChevronRight,
  ClipboardClock,
  LogOut,
  Sparkles,
  UserRoundCog,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { disconnectNotificationSocket } from "@/features/notification/services/notification.ws";
import { appConfig } from "@/config/appConfig";
import { clearAuth, updateUser } from "@/features/auth/state/authSlice";
import MerchantUpgrade from "@/features/merchant/components/MerchantUpgrade";
import { SetProfilePicture } from "../../features/user/components/ProfilePicture";
import { KycTrackingCard } from "@/features/kyc/components/KycTrackingCard";
import { AdminKycTrackingCard } from "@/features/kyc/components/AdminKycTrackingCard";
import NotificationCard from "@/features/notification/components/NotificationDisplayCard";
import { ProfileInfoCard } from "@/features/user/components/ProfileInformationCard";

export function NavUser() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { isMobile } = useSidebar();

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [showMerchantUpgrade, setShowMerchantUpgrade] = useState(false);
  const [showAccountCard, setShowAccountCard] = useState(false);
  const [showKycTracking, setShowKycTracking] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileInfoCard, setShowProfileInfoCard] = useState(false);

  const isMerchant = user?.role === "MERCHANT";
  const isAdmin = user?.role === "ADMIN";
  const isDisabled = isMerchant || isAdmin;

  const merchantUpgradeLabel = isMerchant
    ? "Already a merchant"
    : isAdmin
      ? "You are the Admin"
      : "Upgrade to Merchant";

  const handleLogout = () => {
    disconnectNotificationSocket();
    sessionStorage.removeItem("cashflash_ai_chat_session_v1");
    dispatch(clearAuth());
    navigate(appConfig.routes.root, { replace: true });
  };

  const handleProfilePictureUpdated = (url) => {
    dispatch(updateUser({ profileImageUrl: url }));
  };

  const handleProfileInfoOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    setShowProfileInfoCard(true);
  };

  return (
    <>
      <ProfileInfoCard
        open={showProfileInfoCard}
        onClose={() => setShowProfileInfoCard(false)}
        user={user}
      />

      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onClick={handleProfileInfoOpen}
                >
                  <Avatar className="h-8 w-8 cursor-pointer rounded-lg">
                    <AvatarImage
                      src={user?.profileImageUrl || "/avatar.png"}
                      alt={user?.fullName}
                    />
                    <AvatarFallback className="rounded-lg">CF</AvatarFallback>
                  </Avatar>

                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold cursor-pointer">
                      {user?.fullName}
                    </span>
                    <span className="truncate text-xs cursor-pointer">
                      {user?.email}
                    </span>
                  </div>
                </div>

                <ChevronRight className="ml-auto size-4 shrink-0" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="relative z-50 w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={33}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div
                  className="flex cursor-pointer items-center gap-2 px-1 py-1.5 text-left text-sm"
                  onClick={handleProfileInfoOpen}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.profileImageUrl || "/avatar.png"}
                      alt={user?.fullName}
                    />
                    <AvatarFallback className="rounded-lg">CF</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.fullName}
                    </span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    setOpen(false);
                    setShowMerchantUpgrade(true);
                  }}
                  className={isDisabled ? "cursor-not-allowed opacity-60" : ""}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {merchantUpgradeLabel}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    setOpen(false);
                    setShowAccountCard(true);
                  }}
                >
                  <UserRoundCog className="mr-2 h-4 w-4" />
                  Profile Picture
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setOpen(false);
                    setShowKycTracking(true);
                  }}
                >
                  <ClipboardClock className="mr-2 h-4 w-4" />
                  KYC tracking
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setOpen(false);
                    setShowNotifications(true);
                  }}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-500 hover:bg-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <MerchantUpgrade
        open={showMerchantUpgrade}
        onClose={() => setShowMerchantUpgrade(false)}
      />

      <SetProfilePicture
        open={showAccountCard}
        onClose={() => setShowAccountCard(false)}
        onSuccess={(url) => {
          handleProfilePictureUpdated(url);
        }}
      />

      {showKycTracking &&
        (user?.role === "ADMIN" ? (
          <AdminKycTrackingCard
            open={showKycTracking}
            onClose={() => setShowKycTracking(false)}
          />
        ) : (
          <KycTrackingCard
            open={showKycTracking}
            onClose={() => setShowKycTracking(false)}
          />
        ))}

      {showNotifications && (
        <NotificationCard onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}