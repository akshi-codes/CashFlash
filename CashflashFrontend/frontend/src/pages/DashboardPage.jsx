import { ModeToggle } from "@/components/shared/ModeToggle";
import TransactionTable from "@/features/transaction/components/TransactionTable";
import { WalletCard } from "@/features/wallet/components/WalletCard";
import { useEffect, useState, useRef, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { PaymentManagerCard } from "@/features/payment-methods/components/PaymentManagerCard";
import { QrDisplay } from "@/features/qr/components/QrDisplay";
import QrReader from "@/features/qr/components/QrScanner";
import { SendMoneyCard } from "@/features/wallet/components/SendMoneyCard";
import AllTransactionsCard from "@/features/transaction/components/AllTransactionsCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonPage } from "./SkeletonPage";
import { PaymentServiceCard } from "@/features/payment-methods/components/PaymentServiceCard";
import { getWalletDetailsApi } from "@/features/wallet/services/wallet.services";
import { NotificationDropdown } from "@/features/notification/components/NotificationCard";
import { useNavigate } from "react-router-dom";
import { SetPinCard } from "@/features/auth/components/SetPinCard";
import { Badge } from "@/components/ui/badge";
import { HandCoins, LogOut, PiggyBank } from "lucide-react";
import AdminOverviewCard from "@/features/admin/components/AdminCard";
import ChartAreaCard from "@/components/charts/TransactionsChartsCard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSelector, useDispatch } from "react-redux";
import { clearAuth, updateUser } from "@/features/auth/state/authSlice";
import { appConfig } from "@/config/appConfig";
import { disconnectNotificationSocket } from "@/features/notification/services/notification.ws";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SendRequestCard } from "@/features/payment-request/components/SendRequestCard";
import ContactCard from "@/features/contact/components/ContactCard";
import KycUpgradeCard from "@/features/kyc/components/KycUpgradeCard";
import AiBot from "@/features/ai/components/AiBot";
import RecommendationCard from "@/features/ai/components/RecommendationCard";
import { getAiRecommendation } from "@/features/ai/services/ai_chat.services";
import { fetchWalletBalance } from "@/features/wallet/state/walletSlice";
import { AboutCard, GetStartedCard } from "@/components/shared/InformationCard";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [kycSubmittedThisSession, setKycSubmittedThisSession] = useState(false);
  const [showSidebarQr, setShowSidebarQr] = useState(false);
  const [showScanQr, setShowScanQr] = useState(false);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [allTransactionsSearch, setAllTransactionsSearch] = useState("");
  const [showSpendingBehaviour, setShowSpendingBehaviour] = useState(false);
  const [showPastTransactionsArrow, setShowPastTransactionsArrow] =
    useState(false);
  const [showRecommendationCard, setShowRecommendationCard] = useState(false);
  const [showAboutCard, setShowAboutCard] = useState(false);
  const [showGetStartedCard, setShowGetStartedCard] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const logoutTimer = useRef(null);
  const recommendationAbortRef = useRef(null);
  const pastTransactionsArrowTimer = useRef(null);
  const navigate = useNavigate();

  const isAdmin = user?.role === "ADMIN";
  const showRoleBadge = user?.role === "MERCHANT" || user?.role === "ADMIN";

  const balance = useSelector((state) => state.wallet.balance);

  const shouldShowKycUpgrade =
    user?.isKycCompleted === false && !kycSubmittedThisSession;

  const shouldShowSetPin =
    user?.isPinSet === false &&
    (user?.isKycCompleted === true || kycSubmittedThisSession);

  const reloadWallet = useCallback(async () => {
    const walletData = await getWalletDetailsApi();
    setWallet(walletData.data);
  }, []);

  const loadRecommendation = useCallback(async () => {
    if (recommendationAbortRef.current) {
      recommendationAbortRef.current.abort();
    }

    const controller = new AbortController();
    recommendationAbortRef.current = controller;
    setLoadingRecommendation(true);

    try {
      const res = await getAiRecommendation(controller.signal);
      setRecommendation(res);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      setRecommendation({
        title: "Payment Recommendation",
        message:
          "Keep your wallet, PIN, and bank details updated for smoother and safer payments.",
      });
    } finally {
      setLoadingRecommendation(false);
      recommendationAbortRef.current = null;
    }
  }, []);

  const handleLastTransactionArrow = () => {
    setShowPastTransactionsArrow(true);

    if (pastTransactionsArrowTimer.current) {
      clearTimeout(pastTransactionsArrowTimer.current);
    }

    pastTransactionsArrowTimer.current = setTimeout(() => {
      setShowPastTransactionsArrow(false);
      pastTransactionsArrowTimer.current = null;
    }, 4000);
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        await reloadWallet();
      } catch (error) {
        console.error("Dashboard load failed", error);

        if (!logoutTimer.current) {
          logoutTimer.current = setTimeout(() => {
            navigate(appConfig.routes.login, { replace: true });
          }, 5000);
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);

      if (recommendationAbortRef.current) {
        recommendationAbortRef.current.abort();
      }

      if (pastTransactionsArrowTimer.current) {
        clearTimeout(pastTransactionsArrowTimer.current);
      }
    };
  }, [navigate, reloadWallet]);

  useEffect(() => {
    dispatch(fetchWalletBalance());
  }, [dispatch]);

  const handleWalletRefresh = async () => {
    try {
      await reloadWallet();
      dispatch(fetchWalletBalance());
    } catch (e) {
      console.error("Failed to reload wallet", e);
    }
  };

  const handleRecommendations = async () => {
    setShowRecommendationCard(true);
    await loadRecommendation();
  };

  const handleCloseRecommendationCard = () => {
    if (recommendationAbortRef.current) {
      recommendationAbortRef.current.abort();
    }

    setShowRecommendationCard(false);
  };

  const handleLogout = () => {
    disconnectNotificationSocket();

    if (recommendationAbortRef.current) {
      recommendationAbortRef.current.abort();
    }

    sessionStorage.removeItem("cashflash_ai_chat_session_v1");
    dispatch(clearAuth());
    navigate(appConfig.routes.root, { replace: true });
  };

  if (loading || !wallet) return <SkeletonPage />;

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 56)",
        "--header-height": "calc(var(--spacing) * 16)",
      }}
    >
      <AppSidebar
        className="z-50"
        onShowQr={() => setShowSidebarQr(true)}
        onScanQr={() => setShowScanQr(true)}
        onSendMoney={() => setShowSendMoney(true)}
        onAllTransactions={() => {
          setAllTransactionsSearch("");
          setShowAllTransactions(true);
        }}
        onWalletTransactions={() => {
          setAllTransactionsSearch("Wallet");
          setShowAllTransactions(true);
        }}
        onSelfTransactions={() => {
          setAllTransactionsSearch("Myself");
          setShowAllTransactions(true);
        }}
        onLastTransaction={handleLastTransactionArrow}
        onSpendingBehaviour={() => setShowSpendingBehaviour(true)}
        onRecommendations={handleRecommendations}
        onAbout={() => setShowAboutCard(true)}
        onGetStarted={() => setShowGetStartedCard(true)}
      />

      <SidebarInset>
        <AboutCard
          open={showAboutCard}
          onClose={() => setShowAboutCard(false)}
        />

        <GetStartedCard
          open={showGetStartedCard}
          onClose={() => setShowGetStartedCard(false)}
        />

        <QrDisplay
          open={showSidebarQr}
          onOpenChange={setShowSidebarQr}
          showTrigger={false}
        />

        <RecommendationCard
          open={showRecommendationCard}
          onClose={handleCloseRecommendationCard}
          onRefresh={loadRecommendation}
          recommendation={recommendation}
          loading={loadingRecommendation}
        />

        {showScanQr && <QrReader onClose={() => setShowScanQr(false)} />}

        {showSendMoney && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowSendMoney(false);
              }
            }}
          >
            <SendMoneyCard
              onClose={() => setShowSendMoney(false)}
              onWalletChanged={handleWalletRefresh}
            />
          </div>
        )}

        {showAllTransactions && (
          <AllTransactionsCard
            initialSearch={allTransactionsSearch}
            onClose={() => setShowAllTransactions(false)}
          />
        )}

        {showSpendingBehaviour && (
          <ChartAreaCard onClose={() => setShowSpendingBehaviour(false)} />
        )}

        {shouldShowKycUpgrade && (
          <KycUpgradeCard
            onSuccess={() => {
              setKycSubmittedThisSession(true);
            }}
          />
        )}

        {shouldShowSetPin && (
          <SetPinCard
            onSuccess={() => {
              dispatch(updateUser({ isPinSet: true }));
              handleWalletRefresh();
            }}
          />
        )}

        <div
          className={
            shouldShowKycUpgrade || shouldShowSetPin
              ? "pointer-events-none blur-sm"
              : ""
          }
        >
          <div className="fixed z-10000 top-4 right-4 mt-3 flex items-center gap-2 rounded-md">
            <QrDisplay />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-5 hidden sm:block"
            />
            <NotificationDropdown />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-5 hidden sm:block"
            />
            <ModeToggle />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-5 hidden sm:block"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <LogOut
                  className="w-4 h-10 mx-2.5 cursor-pointer hover:text-red-600 "
                  onClick={handleLogout}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Logout</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-1 flex-col">
            <header className="sticky top-0 z-40 pt-7 flex h-16 items-center gap-2 px-4 bg-background/60 backdrop-blur supports-backdrop-filter:bg-background/40">
              <SidebarTrigger />
              {showRoleBadge && (
                <Badge
                  variant="outline"
                  className={
                    user?.role === "MERCHANT"
                      ? "border-blue-900 text-blue-800 dark:border-blue-500 dark:text-blue-100 ml-3 py-1"
                      : user?.role === "ADMIN"
                        ? "border-yellow-600 text-yellow-700 dark:border-yellow-400 dark:text-yellow-200 ml-3 py-1"
                        : "ml-3 py-1"
                  }
                >
                  {user?.role}
                </Badge>
              )}
              <Separator
                orientation="vertical"
                className="data-[orientation=vertical]:h-5 hidden sm:block mx-3"
              />
              {isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="inline-flex items-center gap-4 border-green-500 text-green-500 mr-3"
                    >
                      <PiggyBank className="h-5 w-5 text-pink-500" />
                      <span>{balance}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Total Fee Collected
                  </TooltipContent>
                </Tooltip>
              )}
            </header>

            <div className="@container/main flex flex-1 flex-col mt-1">
              <div className="flex flex-1 flex-col gap-10 p-4 pt-4 md:pt-6 lg:px-6">
                {isAdmin && (
                  <div className="grid gap-10 grid-cols-1">
                    <div className="relative">
                      <AiBot className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      <AdminOverviewCard />
                    </div>
                  </div>
                )}

                <div className="grid gap-10 grid-cols-1 md:grid-cols-3">
                  <WalletCard wallet={wallet} />
                  <PaymentManagerCard />
                  <PaymentServiceCard
                    onWalletChanged={handleWalletRefresh}
                    showPastTransactionsArrow={showPastTransactionsArrow}
                  />
                </div>

                <div className="grid gap-10 grid-cols-1 lg:grid-cols-2">
                  <SendRequestCard />
                  <ContactCard />
                </div>

                <div className="relative">
                  <ScrollArea className="h-50 rounded-md border card-glow">
                    <TransactionTable />
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
