import { Button } from "@/components/ui/button";
import { Plus, HandCoins, EllipsisVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { AddAccountCard } from "@/features/bank-account/components/AddBankAccountCard";
import { AddCardCard } from "@/features/card/components/AddCardCard";
import { getPaymentMethodDetails } from "@/features/payment-methods/services/payment-methods.services";
import { PaymentMethodsCard } from "@/features/payment-methods/components/CardBankCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PaymentManagerCard() {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [bankCount, setBankCount] = useState(0);

  const cardLabel = cardCount === 1 ? "Card" : "Cards";
  const bankLabel = bankCount === 1 ? "Account" : "Accounts";

  const fetchPaymentMethods = async () => {
    const res = await getPaymentMethodDetails();
    const data = res.data;

    setCardCount(data.cards?.length || 0);
    setBankCount(data.bankAccounts?.length || 0);
  };

  useEffect(() => {
    const loadPaymentMethods = async () => {
      await fetchPaymentMethods();
    };

    loadPaymentMethods();
  }, []);

  return (
    <>
      <div className="relative rounded-xl border bg-card p-6 shadow-sm card-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HandCoins className="h-5 w-5" />
            <span className="text-md font-medium">My Cards and Accounts</span>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowPaymentMethods(true)}
                  className="h-8 w-4"
                >
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Payment methods</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-semibold tracking-tight">
            {cardCount} {cardLabel} · {bankCount} {bankLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ready for payments
          </p>
        </div>

        <div className="mt-6 justify-end hidden min-[1140px]:flex max-sm:flex gap-2">
          <Button size="sm" onClick={() => setShowAddAccount(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Account
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddCard(true)}
            className="w-30"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Card
          </Button>
        </div>
      </div>

      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm">
          <AddAccountCard
            onClose={() => setShowAddAccount(false)}
            onSuccess={fetchPaymentMethods}
          />
        </div>
      )}

      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm">
          <AddCardCard
            onClose={() => setShowAddCard(false)}
            onSuccess={fetchPaymentMethods}
          />
        </div>
      )}
      {showPaymentMethods && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl">
            <PaymentMethodsCard
              onClose={() => {
                setShowPaymentMethods(false); 
                fetchPaymentMethods(); 
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
