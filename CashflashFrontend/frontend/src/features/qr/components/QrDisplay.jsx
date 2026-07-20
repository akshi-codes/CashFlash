/* eslint-disable react-hooks/set-state-in-effect */
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QrDisplayCard } from "./QrCard";
import { QrDisplayCardSkeleton } from "@/pages/SkeletonPage";
import { useSelector } from "react-redux";
import { QrCode, X } from "lucide-react";

export function QrDisplay({ open, onOpenChange, showTrigger = true }) {
  const user = useSelector((state) => state.auth.user);

  const [internalOpen, setInternalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);

  const isControlled = open !== undefined;
  const showQr = isControlled ? open : internalOpen;

  const handleOpenChange = (value) => {
    if (!isControlled) {
      setInternalOpen(value);
    }

    if (onOpenChange) {
      onOpenChange(value);
    }
  };

  useEffect(() => {
    if (!showQr) return;

    setQrLoading(true);
    const t = setTimeout(() => setQrLoading(false), 3000);
    return () => clearTimeout(t);
  }, [showQr]);

  if (!user?.phoneNumber) return null;

  return (
    <>
      {showTrigger && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleOpenChange(true)}
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>QR Code</p>
          </TooltipContent>
        </Tooltip>
      )}

      {showQr &&
        createPortal(
          <div className="fixed inset-0 z-50 flex overflow-hidden items-center justify-center overscroll-none bg-background/25 backdrop-blur-sm">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="absolute top-3 right-14 z-10 text-red-600 hover:bg-red-500"
              >
                <X className="h-6 w-6" />
              </Button>

              {qrLoading ? (
                <QrDisplayCardSkeleton />
              ) : (
                <QrDisplayCard
                  phoneNumber={user.phoneNumber}
                  onClose={() => handleOpenChange(false)}
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}