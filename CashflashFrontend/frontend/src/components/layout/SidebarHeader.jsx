import * as React from "react";
import { useSelector } from "react-redux";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logoBlack from "@/assets/cashflash-logos/logo-black.png";
import logoWhite from "@/assets/cashflash-logos/logo-white.png";
import { maskPaymentId } from "@/lib/utils";

const SidebarLogo = () => (
  <>
    <img
      src={logoBlack}
      alt="Logo"
      className="block h-6 w-auto object-contain dark:hidden"
    />
    <img
      src={logoWhite}
      alt="Logo"
      className="hidden h-6 w-auto object-contain dark:block"
    />
  </>
);

export function SidebarHeaderProfile() {
  const user = useSelector((state) => state.auth.user);
  const maskedPaymentId = maskPaymentId(user?.phoneNumber);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mt-3"
        >
        
          <div className="flex aspect-square size-8 items-center justify-center">
            <SidebarLogo />
          </div>

          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-semibold text-foreground pl-1">
              <span className="text-primary">{maskedPaymentId}</span>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
