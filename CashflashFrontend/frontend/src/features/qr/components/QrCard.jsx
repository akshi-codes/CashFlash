import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function QrDisplayCard({ phoneNumber }) {
  const [copied, setCopied] = useState(false);

  const cashflashId = `${phoneNumber}@cashflash`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    cashflashId
  )}&size=300x300`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cashflashId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="w-120 max-w-[90%] h-125 rounded-2xl border bg-card p-6 shadow-xl relative overflow-visible animate-in scale-in duration-200 flex flex-col items-center justify-center">
      <h2 className="text-lg font-semibold text-center mb-8">Scan the QR</h2>

      <img src={qrUrl} alt="QR Code" className="w-72 h-72 mb-2" />

      <div className="pt-8 flex items-center justify-center pl-3 gap-2">
        <p className="text-xl text-muted-foreground text-center">{cashflashId}</p>

        <Button
          size="icon"
          variant="ghost"
          onClick={handleCopy}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
        >
          {copied ? <Check className="h-8 w-8" /> : <Copy className="h-8 w-8" />}
        </Button>
      </div>
    </div>
  );
}