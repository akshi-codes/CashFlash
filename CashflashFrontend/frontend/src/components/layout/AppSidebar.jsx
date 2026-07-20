import * as React from "react";
import {
  ArrowLeftCircle,
  ArrowLeftRight,
  BookOpen,
  Bot,
  Map,
  PieChart,
  SquareTerminal,
} from "lucide-react";
import { NavMain } from "./NavMain";
import { NavProjects } from "./NavProjects";
import { NavUser } from "./NavUser";
import { SidebarHeaderProfile } from "./SidebarHeader";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSelector } from "react-redux";

export function AppSidebar({
  onShowQr,
  onScanQr,
  onSendMoney,
  onAllTransactions,
  onWalletTransactions,
  onSelfTransactions,
  onLastTransaction,
  onSpendingBehaviour,
  onRecommendations,
  onAbout,
  onGetStarted,
  ...props
}) {
  const user = useSelector((state) => state.auth.user);

  if (!user) return null;

  const data = {
    user: { name: user.name, email: user.email, avatar: "./avatar.png" },
    navMain: [
      {
        title: "Quick Actions",
        icon: SquareTerminal,
        isActive: true,
        items: [
          { title: "Show QR", onClick: onShowQr },
          { title: "Scan QR", onClick: onScanQr },
          { title: "Send Money", onClick: onSendMoney },
        ],
      },
      {
        title: "Transactions",
        icon: ArrowLeftRight,
        isActive: false,
        items: [
          { title: "All Transactions", onClick: onAllTransactions },
          { title: "Wallet Transactions", onClick: onWalletTransactions },
          { title: "Self Transactions", onClick: onSelfTransactions },
        ],
      },
      {
        title: "Documentation",
        icon: BookOpen,
        items: [
          { title: "About", onClick: onAbout },
          { title: "Get Started", onClick: onGetStarted },
        ],
      },
    ],
    projects: [
      {
        name: "Last transaction",
        onClick: onLastTransaction,
        icon: ArrowLeftCircle,
      },
      {
        name: "Spending behaviour",
        onClick: onSpendingBehaviour,
        icon: PieChart,
      },
      {
        name: "Recommendations",
        onClick: onRecommendations,
        icon: Map,
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarHeaderProfile />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>

      <SidebarFooter className="overflow-visible px-3 pb-3">
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
