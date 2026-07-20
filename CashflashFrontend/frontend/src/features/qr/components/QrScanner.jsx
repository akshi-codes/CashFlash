import { useEffect, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { X, ScanQrCode, Copy, Check } from "lucide-react";

const QrReader = ({ onClose }) => {
  const scannerWrapperRef = useRef(null);

  const [copied, setCopied] = useState(false);
  const [scannedResult, setScannedResult] = useState("");
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);

  const handleCopy = async () => {
    if (!scannedResult) return;

    try {
      await navigator.clipboard.writeText(scannedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = scannedResult;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  useEffect(() => {
    let cleanup = () => {};

    const attachVideoListeners = () => {
      const wrapper = scannerWrapperRef.current;
      if (!wrapper) return false;

      const video = wrapper.querySelector("video");
      if (!video) return false;

      const handleLoaded = () => {
        setVideoReady(true);
        setError("");
      };

      const handlePlaying = () => {
        setVideoReady(true);
        setError("");
      };

      video.addEventListener("loadedmetadata", handleLoaded);
      video.addEventListener("loadeddata", handleLoaded);
      video.addEventListener("playing", handlePlaying);

      cleanup = () => {
        video.removeEventListener("loadedmetadata", handleLoaded);
        video.removeEventListener("loadeddata", handleLoaded);
        video.removeEventListener("playing", handlePlaying);
      };

      return true;
    };

    const interval = setInterval(() => {
      if (attachVideoListeners()) {
        clearInterval(interval);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, []);

  const handleScan = (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;

    const firstCode = detectedCodes[0];
    const value = firstCode?.rawValue || "";

    if (!value) return;

    setScannedResult(value);
    setPaused(true);
  };

  const handleError = (err) => {
    console.error("QR SCAN ERROR:", err);
    setVideoReady(false);
    setError(err?.message || "Unable to start camera");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
      <div className="relative h-125 w-100 max-w-[90%] rounded-2xl border bg-card p-4 shadow-xl animate-in scale-in duration-200">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="mb-4 flex items-center gap-2">
          <ScanQrCode className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Scan QR Code</h2>
        </div>

        <div
          ref={scannerWrapperRef}
          className="relative overflow-hidden rounded-xl border bg-black"
        >
          <Scanner
            onScan={handleScan}
            onError={handleError}
            paused={paused}
            scanDelay={300}
            allowMultiple={false}
            formats={["qr_code"]}
            constraints={{
              facingMode: "environment",
            }}
            components={{
              finder: false,
            }}
            styles={{
              container: {
                width: "100%",
                height: "22.5rem",
                background: "black",
              },
              video: {
                width: "100%",
                height: "22.5rem",
                objectFit: "cover",
              },
            }}
          />

          {!videoReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-white/50">
                <span className="text-xs text-white/70">
                  {error || "Initializing camera…"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 text-center text-xs">
          {!scannedResult ? (
            <p className="text-muted-foreground">
              Align the QR code within the frame
            </p>
          ) : (
            <div className="break-all rounded-lg border bg-muted/50 text-green-700 dark:text-green-400">
              <div className="flex">
                <div className="my-3 flex-1 pl-8 text-lg">{scannedResult}</div>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleCopy}
                  className="mr-3 mt-2"
                  title="Copy"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrReader;