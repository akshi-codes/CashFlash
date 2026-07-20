import { Wallet, Plus, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { AddMoneyCard } from "./AddMoneyCard";
import { WithdrawMoneyCard } from "./WithdrawMoneyCard";
import { formatRelativeTime } from "@/lib/utils";
import CountUp from "@/components/shared/CountUp";

export function WalletCard({ wallet }) {
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showWithdrawMoney, setShowWithdrawmoney] = useState(false);
  const [localWallet, setLocalWallet] = useState(wallet);

  useEffect(() => {
    setLocalWallet(wallet);
  }, [wallet]);

  if (!localWallet) return null;

  const isDisabled = !localWallet.isActive || localWallet.isFrozen;

  return (
    <>
      <div className="relative rounded-xl border bg-card p-6 pt-7 shadow-sm card-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-5 w-5" />
            <span className="text-md font-medium">My Wallet</span>

            {localWallet.isFrozen && (
              <Badge
                variant="secondary"
                className="border-yellow-500 text-yellow-600"
              >
                Frozen
              </Badge>
            )}
          </div>

          <span className="hidden min-[1120px]:inline max-sm:inline text-[10px] text-muted-foreground">
            Updated {formatRelativeTime(new Date(localWallet.updatedAt))}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-semibold tracking-tight">
            ₹ <span></span>
            <CountUp
              from={0}
              to={localWallet.balance}
              separator=","
              direction="up"
              duration={1}
              className="count-up-text"
              startCounting={false}
            />
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Available balance
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {localWallet.isActive ? (
              <Badge
                variant="outline"
                className="border-green-600 text-green-600"
              >
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-600 text-red-600">
                Inactive
              </Badge>
            )}
          </div>

          <div className="hidden min-[1140px]:flex max-sm:flex gap-2">
            <Button
              size="sm"
              disabled={isDisabled}
              onClick={() => setShowAddMoney(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Money
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isDisabled}
              onClick={() => setShowWithdrawmoney(true)}
            >
              <ArrowDown className="mr-1 h-4 w-4" />
              Withdraw
            </Button>
          </div>
        </div>
      </div>

      {showAddMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-cente backdrop-blur-sm">
          <AddMoneyCard
            onClose={() => setShowAddMoney(false)}
            onSuccess={(amountAdded) => {
              setLocalWallet((prev) => ({
                ...prev,
                balance: Number(prev.balance) + Number(amountAdded),
                updatedAt: new Date().toISOString(),
              }));
            }}
          />
        </div>
      )}

      {showWithdrawMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <WithdrawMoneyCard
            onClose={() => setShowWithdrawmoney(false)}
            onSuccess={(amountWithdrawn) => {
              setLocalWallet((prev) => ({
                ...prev,
                balance: Number(prev.balance) - Number(amountWithdrawn),
                updatedAt: new Date().toISOString(),
              }));
            }}
          />
        </div>
      )}
    </>
  );
}
