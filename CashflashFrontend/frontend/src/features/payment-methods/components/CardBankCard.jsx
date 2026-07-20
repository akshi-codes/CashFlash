import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, CircleCheck, X } from "lucide-react";
import { getPaymentMethodDetails } from "@/features/payment-methods/services/payment-methods.services";
import { CoverflowCarousel } from "@/components/shared/Carousel";
import { VerifyPinCard } from "@/features/auth/components/VerifyPinCard";

/* ===================== ASSETS ===================== */
import sbi from "@/assets/bank-logos/SBIN.NS.png";
import can from "@/assets/bank-logos/CANBK.NS.png";
import bob from "@/assets/bank-logos/BANKBARODA.NS.png";
import ind from "@/assets/bank-logos/BANKINDIA.NS.png";
import pnb from "@/assets/bank-logos/PNB.NS.png";
import uni from "@/assets/bank-logos/UNIONBANK.NS.png";

import chip from "@/assets/card-logos/chip.png";
import logo from "@/assets/cashflash-logos/logo-white.png";
import visa from "@/assets/card-logos/V.png";
import mast from "@/assets/card-logos/MA.png";
import rupy from "@/assets/card-logos/RUPAY.png";
import amex from "@/assets/card-logos/AXP.png";
import {
  activateAccount,
  deactivateAccount,
  getBalance,
  setDefaultBankAccount,
} from "@/features/bank-account/services/bank-account.services";
import {
  activateCard,
  deactivateCard,
  setDefaultCard,
} from "../../card/services/card.services";

/* ===================== CARD PREVIEW ===================== */

const providerLogoMap = {
  VISA: visa,
  MASTERCARD: mast,
  RUPAY: rupy,
  AMERICAN_EXPRESS: amex,
};

const providerGradientMap = {
  VISA: "linear-gradient(90deg,#7a5a1e,#c9a227,#7a5a1e)",
  MASTERCARD: "linear-gradient(90deg,#000e21,#1e90ff,#000e21)",
  RUPAY: "linear-gradient(90deg,#f00202,#0a0000,#f00202)",
  AMERICAN_EXPRESS: "linear-gradient(90deg,#210033,#5f2eea,#210033)",
  DEFAULT: "linear-gradient(135deg,#1e3c72,#2a5298)",
};

function CardPreview({ card }) {
  const [flipped, setFlipped] = useState(false);
  const maskedNumber = `•••• •••• •••• ${card.last4}`;

  return (
    <div
      className="w-90 h-56 perspective cursor-pointer select-none"
      onClick={() => setFlipped((p) => !p)}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className={`relative w-full h-full transition-transform duration-700 ${
          flipped ? "rotate-y-180" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 rounded-xl shadow-xl text-white p-6 flex flex-col justify-between overflow-hidden select-none"
          style={{
            background:
              providerGradientMap[card.provider] || providerGradientMap.DEFAULT,
            backfaceVisibility: "hidden",
          }}
        >
          <div className="flex justify-between items-center">
            <img src={logo} className="w-8 h-8" alt="CashFlash logo" />
            <img
              src={providerLogoMap[card.provider]}
              className="h-8 object-contain"
              alt={card.provider}
              draggable={false}
            />
          </div>

          <div className="text-2xl tracking-widest">{maskedNumber}</div>

          <div className="flex justify-between items-end">
            <div>
              <div className="text-xs opacity-70">Type</div>
              <div className="uppercase">{card.type}</div>
            </div>

            <img
              src={chip}
              className="w-16 h-12"
              alt="Card chip"
              draggable={false}
            />

            <div>
              <div className="text-xs opacity-70">Expires</div>
              <div>
                {card.expiryMonth}/{String(card.expiryYear).slice(2)}
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-xl shadow-xl text-white p-6 flex flex-col justify-between select-none"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            background:
              providerGradientMap[card.provider] || providerGradientMap.DEFAULT,
          }}
        >
          <div className="h-12 bg-black/90 rounded-md" />

          <div className="flex justify-end mt-6">
            <div className="bg-white text-black px-4 py-2 rounded font-mono tracking-widest">
              ***
            </div>
          </div>

          <div className="text-[10px] opacity-60">Not Valid Unless Signed</div>
        </div>
      </div>
    </div>
  );
}

function ActionTooltip({ label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/* ===================== MAIN COMPONENT ===================== */

export function PaymentMethodsCard({ onClose }) {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("banks");
  const [bankBalance, setBankBalance] = useState({
    bankAccountId: null,
    balance: undefined,
    loading: false,
  });

  const [showBalancePinVerify, setShowBalancePinVerify] = useState(false);
  const balanceBankAccountIdRef = useRef(null);

  const banks = {
    "State Bank of India": sbi,
    "Canara Bank": can,
    "Bank of Baroda": bob,
    "Bank of India": ind,
    "Punjab National Bank": pnb,
    "Union Bank of India": uni,
  };

  useEffect(() => {
    async function loadMethods() {
      try {
        const response = await getPaymentMethodDetails();
        setBankAccounts(response.data.bankAccounts || []);
        setCards(response.data.cards || []);
      } catch (error) {
        console.error("Failed to load payment methods", error);
      } finally {
        setLoading(false);
      }
    }

    loadMethods();
  }, []);

  const handleGetBalance = (bankAccountId) => {
    if (bankBalance.loading) return;
    balanceBankAccountIdRef.current = bankAccountId;
    setShowBalancePinVerify(true);
  };

  const fetchBalance = async (bankAccountId) => {
    if (bankBalance.loading) return;

    setBankBalance({ bankAccountId, balance: undefined, loading: true });

    try {
      const res = await getBalance(bankAccountId);
      const balance = res?.data?.balance;
      setBankBalance({ bankAccountId, balance: balance ?? 0, loading: false });
    } catch (e) {
      console.error("Failed to fetch balance", e);
      setBankBalance({ bankAccountId, balance: undefined, loading: false });
    }
  };

  const handleBalancePinSuccess = async () => {
    const id = balanceBankAccountIdRef.current;

    setShowBalancePinVerify(false);
    balanceBankAccountIdRef.current = null;

    if (!id) return;
    await fetchBalance(id);
  };

  const handleDeactivateBank = async (id) => {
    if (updatingId) return;
    setUpdatingId(id);

    const previous = [...bankAccounts];

    setBankAccounts((prev) =>
      prev.map((b) => (b.bankAccountId === id ? { ...b, isActive: false } : b)),
    );

    try {
      await deactivateAccount(id);
    } catch (err) {
      console.error("Failed to deactivate bank account", err);
      setBankAccounts(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleActivateBank = async (id) => {
    if (updatingId) return;
    setUpdatingId(id);

    const previous = [...bankAccounts];

    setBankAccounts((prev) =>
      prev.map((b) => (b.bankAccountId === id ? { ...b, isActive: true } : b)),
    );

    try {
      await activateAccount(id);
    } catch (err) {
      console.error("Failed to activate bank account", err);
      setBankAccounts(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeactivateCard = async (id) => {
    if (updatingId) return;
    setUpdatingId(id);

    const previous = [...cards];

    setCards((prev) =>
      prev.map((c) => (c.cardId === id ? { ...c, isActive: false } : c)),
    );

    try {
      await deactivateCard(id);
    } catch (err) {
      console.error("Failed to deactivate card", err);
      setCards(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleActivateCard = async (id) => {
    if (updatingId) return;
    setUpdatingId(id);

    const previous = [...cards];

    setCards((prev) =>
      prev.map((c) => (c.cardId === id ? { ...c, isActive: true } : c)),
    );

    try {
      await activateCard(id);
    } catch (err) {
      console.error("Failed to activate card", err);
      setCards(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetDefaultBank = async (id) => {
    if (updatingId) return;
    setUpdatingId(id);

    const previous = [...bankAccounts];

    setBankAccounts((prev) =>
      prev.map((b) => ({
        ...b,
        isDefault: b.bankAccountId === id,
      })),
    );

    try {
      await setDefaultBankAccount(id);
    } catch (err) {
      console.error("Failed to set default bank", err);
      setBankAccounts(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetDefaultCard = async (id) => {
    if (updatingId) return;
    setUpdatingId(id);

    const previous = [...cards];

    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        isDefault: c.cardId === id,
      })),
    );

    try {
      await setDefaultCard(id);
    } catch (err) {
      console.error("Failed to set default card", err);
      setCards(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <TooltipProvider>
      <Card className="relative w-175 h-125">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleClose}
          className="swiper-no-swiping absolute top-3 right-3 text-red-600 hover:bg-red-500"
        >
          <X className="h-6 w-6" />
        </Button>

        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your bank accounts and cards</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center">
              Loading payment methods…
            </p>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="relative grid w-72 mx-auto grid-cols-2 rounded-none border-b border-border bg-transparent p-0 h-11">
                <span
                  className={`absolute bottom-0 left-0 h-0.75 w-1/2 rounded-full bg-blue-600 transition-transform duration-300 ease-in-out ${
                    activeTab === "cards" ? "translate-x-full" : "translate-x-0"
                  }`}
                />

                <TabsTrigger
                  value="banks"
                  className="
        swiper-no-swiping relative z-10 rounded-none border-0 bg-transparent
        px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground shadow-none
        transition-colors hover:text-foreground
        data-[state=active]:bg-transparent
        data-[state=active]:text-foreground
        data-[state=active]:shadow-none
      "
                >
                  Bank Accounts
                </TabsTrigger>

                <TabsTrigger
                  value="cards"
                  className="
        swiper-no-swiping relative z-10 rounded-none border-0 bg-transparent
        px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground shadow-none
        transition-colors hover:text-foreground
        data-[state=active]:bg-transparent
        data-[state=active]:text-foreground
        data-[state=active]:shadow-none
      "
                >
                  Cards
                </TabsTrigger>
              </TabsList>

              {/* ================= BANK ACCOUNTS ================= */}
              <TabsContent value="banks" className="mt-4">
                {bankAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    No bank accounts added
                  </p>
                ) : (
                  <CoverflowCarousel
                    items={bankAccounts.map((bank) => ({
                      ...bank,
                      key: bank.bankAccountId,
                    }))}
                    renderItem={(bank) => (
                      <div
                        className="w-90 select-none"
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        <div
                          className={`
                            relative rounded-2xl border bg-card p-4 flex flex-col gap-3
                            w-90 min-h-56
                            border-emerald-500/20
                            shadow-[0_0_20px_rgba(16,185,129,0.15)]
                            select-none
                            ${!bank.isActive ? "opacity-50 grayscale" : ""}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden">
                                {banks[bank.bankName] ? (
                                  <img
                                    src={banks[bank.bankName]}
                                    alt={bank.bankName}
                                    className="h-6 w-6 object-contain"
                                    draggable={false}
                                  />
                                ) : (
                                  <i className="fa fa-university text-lg text-muted-foreground" />
                                )}
                              </div>

                              <div>
                                <p className="font-semibold text-lg">
                                  {bank.bankName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  •••• {bank.last4}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-48 pt-18 pl-2 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">IFSC</span>
                              <span>{bank.ifsc || "—"}</span>
                            </div>

                            <div className="flex flex-col">
                              <span className="font-medium">Balance</span>

                              {bankBalance.bankAccountId ===
                                bank.bankAccountId &&
                              bankBalance.balance !== undefined ? (
                                <button
                                  type="button"
                                  className="swiper-no-swiping text-left underline underline-offset-4 text-sm"
                                  disabled={bankBalance.loading}
                                  onClick={() =>
                                    handleGetBalance(bank.bankAccountId)
                                  }
                                >
                                  ₹{" "}
                                  {Number(
                                    bankBalance.balance || 0,
                                  ).toLocaleString("en-IN")}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="swiper-no-swiping text-left underline underline-offset-4 text-sm text-muted-foreground hover:text-foreground"
                                  disabled={bankBalance.loading}
                                  onClick={() =>
                                    handleGetBalance(bank.bankAccountId)
                                  }
                                >
                                  {bankBalance.loading &&
                                  bankBalance.bankAccountId ===
                                    bank.bankAccountId
                                    ? "Fetching…"
                                    : "View"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="swiper-no-swiping flex w-90 pt-4 justify-end items-center gap-2">
                          {bank.isActive ? (
                            <>
                              <ActionTooltip
                                label={
                                  bank.isDefault
                                    ? "Default bank account"
                                    : "Set as default"
                                }
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="swiper-no-swiping"
                                  disabled={
                                    bank.isDefault ||
                                    updatingId === bank.bankAccountId
                                  }
                                  onClick={() =>
                                    handleSetDefaultBank(bank.bankAccountId)
                                  }
                                >
                                  <CircleCheck
                                    className="h-8 w-8"
                                    color={
                                      bank.isDefault
                                        ? "#11ff00"
                                        : "currentColor"
                                    }
                                  />
                                </Button>
                              </ActionTooltip>

                              <ActionTooltip
                                label={
                                  bank.isDefault
                                    ? "Cannot deactivate a default bank account"
                                    : "Deactivate bank account"
                                }
                              >
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="swiper-no-swiping"
                                  disabled={
                                    updatingId === bank.bankAccountId ||
                                    bank.isDefault
                                  }
                                  onClick={() =>
                                    handleDeactivateBank(bank.bankAccountId)
                                  }
                                >
                                  <Trash2 className="h-8 w-8 text-red-600" />
                                </Button>
                              </ActionTooltip>
                            </>
                          ) : (
                            <ActionTooltip label="Activate bank account">
                              <Button
                                size="sm"
                                className="swiper-no-swiping min-w-30 justify-center"
                                disabled={updatingId === bank.bankAccountId}
                                onClick={() =>
                                  handleActivateBank(bank.bankAccountId)
                                }
                              >
                                Reactivate account
                              </Button>
                            </ActionTooltip>
                          )}
                        </div>
                      </div>
                    )}
                  />
                )}
              </TabsContent>

              {/* ================= CARDS ================= */}
              <TabsContent value="cards" className="mt-4">
                {cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">
                    No cards added
                  </p>
                ) : (
                  <CoverflowCarousel
                    items={cards.map((card) => ({
                      ...card,
                      key: card.cardId,
                    }))}
                    renderItem={(card) => (
                      <div
                        className={`space-y-2 w-90 select-none ${
                          !card.isActive ? "opacity-50 grayscale" : ""
                        }`}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        <CardPreview card={card} />

                        <div className="swiper-no-swiping flex w-90 pt-2 justify-end items-center gap-2">
                          {card.isActive ? (
                            <>
                              <ActionTooltip
                                label={
                                  card.isDefault
                                    ? "Default card"
                                    : "Set as default"
                                }
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`swiper-no-swiping flex items-center justify-center ${
                                    card.isDefault
                                      ? "opacity-60 cursor-default"
                                      : ""
                                  }`}
                                  disabled={
                                    card.isDefault || updatingId === card.cardId
                                  }
                                  onClick={() =>
                                    handleSetDefaultCard(card.cardId)
                                  }
                                >
                                  <CircleCheck
                                    className="h-8 w-8"
                                    color={
                                      card.isDefault
                                        ? "#11ff00"
                                        : "currentColor"
                                    }
                                  />
                                </Button>
                              </ActionTooltip>

                              <ActionTooltip
                                label={
                                  card.isDefault
                                    ? "Cannot deactivate a default card"
                                    : "Deactivate card"
                                }
                              >
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={`swiper-no-swiping text-red-600 ${
                                    card.isDefault
                                      ? "opacity-40 cursor-not-allowed"
                                      : ""
                                  }`}
                                  disabled={
                                    updatingId === card.cardId || card.isDefault
                                  }
                                  onClick={() =>
                                    handleDeactivateCard(card.cardId)
                                  }
                                >
                                  <Trash2 className="h-8 w-8" />
                                </Button>
                              </ActionTooltip>
                            </>
                          ) : (
                            <ActionTooltip label="Activate card">
                              <Button
                                size="sm"
                                className="swiper-no-swiping min-w-30 justify-center"
                                disabled={updatingId === card.cardId}
                                onClick={() => handleActivateCard(card.cardId)}
                              >
                                Reactivate card
                              </Button>
                            </ActionTooltip>
                          )}
                        </div>
                      </div>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>
          )}

          {showBalancePinVerify && (
            <VerifyPinCard
              open={showBalancePinVerify}
              onClose={() => {
                setShowBalancePinVerify(false);
                balanceBankAccountIdRef.current = null;
              }}
              onSuccess={handleBalancePinSuccess}
            />
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
