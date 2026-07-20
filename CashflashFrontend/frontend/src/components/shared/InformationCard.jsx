import { useEffect } from "react";
import {
  BookOpen,
  Compass,
  CreditCard,
  Landmark,
  ShieldCheck,
  Wallet,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SCROLL_LOCK_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

function InformationCard({
  open,
  onClose,
  icon,
  title,
  subtitle,
  children,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const preventScroll = (event) => {
      event.preventDefault();
    };

    const preventKeyScroll = (event) => {
      if (SCROLL_LOCK_KEYS.has(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventKeyScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeyScroll);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const IconComponent = icon;

  return (
    <div className="fixed inset-0 z-100 overflow-hidden overscroll-none bg-background/25 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="absolute right-3 top-3 text-red-600 hover:bg-red-500"
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="mb-5 flex items-center gap-3 pr-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
              {IconComponent ? <IconComponent className="h-6 w-6" /> : null}
            </div>

            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-muted/30 p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl" />
            <div className="relative grid gap-5 text-sm leading-6 text-muted-foreground">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutCard({ open, onClose }) {
  return (
    <InformationCard
      open={open}
      onClose={onClose}
      icon={Info}
      title="About CashFlash"
      subtitle="A simpler way to manage wallet payments, bank links, cards, and transfers."
    >
      <p>
        CashFlash brings wallet balance, payment methods, requests, and
        transaction activity into one place so payments feel faster and easier
        to track.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <Wallet className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium">Wallet First</span>
          </div>
          <p>
            Add money, withdraw, and move funds quickly while keeping wallet
            activity visible.
          </p>
        </div>

        <div className="rounded-xl border bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium">Safer Flow</span>
          </div>
          <p>
            PIN verification, payment method controls, and transaction tracking
            help keep daily usage safer.
          </p>
        </div>
      </div>
    </InformationCard>
  );
}

export function GetStartedCard({ open, onClose }) {
  return (
    <InformationCard
      open={open}
      onClose={onClose}
      icon={Compass}
      title="Get Started With CashFlash"
      subtitle="A quick path to make your account useful right away."
    >
      <p>
        Start with the essentials first, then use the sidebar shortcuts to move
        through transfers, requests, and transaction insights more easily.
      </p>

      <div className="grid gap-3">
        <div className="rounded-xl border bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <Landmark className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium">1. Link a bank account</span>
          </div>
          <p>
            Add a bank account so you can top up, withdraw, and keep one default
            payment source ready.
          </p>
        </div>

        <div className="rounded-xl border bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium">2. Add a card</span>
          </div>
          <p>
            Save a card for faster payments and keep your preferred method
            available when you need it.
          </p>
        </div>

        <div className="rounded-xl border bg-background/70 p-4">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <BookOpen className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium">3. Explore quick actions</span>
          </div>
          <p>
            Use sidebar actions like Show QR, Scan QR, Send Money, and
            Transactions to move through the app faster.
          </p>
        </div>
      </div>
    </InformationCard>
  );
}

export default InformationCard;
