import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function PastTransactionsAnimation() {
  return (
    <div className="rounded-md border card-glow p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold">Past Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Transaction history animation
        </p>
      </div>

      <div className="flex items-center justify-center rounded-md min-h-60">
        <DotLottieReact
          src="/animations/arrow.lottie"
          autoplay
          loop
          className="w-full max-w-[320px] h-60"
        />
      </div>
    </div>
  );
}