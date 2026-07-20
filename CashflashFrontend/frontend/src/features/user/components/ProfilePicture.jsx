import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { X, CheckCircle2, Upload, ZoomIn, ZoomOut, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { setProfilePictureApi } from "@/features/user/services/user.services";

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const ASPECT_RATIO = 1;

export function SetProfilePicture({ open, onClose, onSuccess }) {
  const [image, setImage] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const [blob, setBlob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  useEffect(() => {
    if (open) return;
    setImage(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError("");
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setIsCropOpen(false);
    setBlob(null);
    setSubmitting(false);
    setShowSuccess(false);
  }, [open, previewImage]);

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    setError("");

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError(
        `File type not supported. Accepted types: ${ACCEPTED_FILE_TYPES.join(", ")}`,
      );
      return;
    }

    if (file.size > MAX_SIZE) {
      setError(
        `File is too large. Maximum size: ${MAX_SIZE / (1024 * 1024)}MB`,
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const openFilePicker = () => inputRef.current?.click();

  const applyCrop = useCallback(async () => {
    if (!image || !croppedAreaPixels) return;

    const img = new Image();
    img.src = image;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(croppedAreaPixels.width);
    canvas.height = Math.round(croppedAreaPixels.height);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      Math.round(croppedAreaPixels.x),
      Math.round(croppedAreaPixels.y),
      Math.round(croppedAreaPixels.width),
      Math.round(croppedAreaPixels.height),
      0,
      0,
      Math.round(croppedAreaPixels.width),
      Math.round(croppedAreaPixels.height),
    );

    canvas.toBlob(
      (b) => {
        if (!b) return;
        if (previewImage) URL.revokeObjectURL(previewImage);
        const previewUrl = URL.createObjectURL(b);
        setPreviewImage(previewUrl);
        setBlob(b);
        setIsCropOpen(false);
        setError("");
      },
      "image/jpeg",
      0.92,
    );
  }, [image, croppedAreaPixels, previewImage]);

  const handleUpload = useCallback(async () => {
    if (!blob) {
      setError("Please choose an image");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const file = new File([blob], `profile-${Date.now()}.jpg`, {
        type: blob.type || "image/jpeg",
      });

      const fd = new FormData();
      fd.append("file", file);

      const res = await setProfilePictureApi(fd);
      const url = res?.data?.profileImageUrl;

      if (!url) throw new Error("profileImageUrl missing in response");

      setShowSuccess(true);
      onSuccess?.(url);

      setTimeout(() => onClose?.(), 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Upload failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [blob, onClose, onSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden items-center overscroll-none bg-background/25 justify-center">
      <div className="absolute inset-0 bg-background/30 backdrop-blur-sm" />

      <div className="w-100 max-w-[90%] sm:max-w-lg min-h-115 rounded-2xl border bg-card p-6 shadow-xl relative animate-in scale-in duration-200">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
          disabled={submitting}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex items-center gap-2 mb-10">
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Set Profile Picture</h2>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_FILE_TYPES.join(",")}
          onChange={(e) =>
            handleFileSelect(e.target.files ? e.target.files[0] : null)
          }
        />

        {!isCropOpen ? (
          <div className="grid gap-4">
            {!previewImage ? (
              <div
                className="border-2 border-dashed rounded-lg h-90 p-8 my-8 text-center cursor-pointer hover:bg-muted/20 transition-colors flex flex-col items-center justify-center"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={openFilePicker}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop an image here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {`Accepted formats: ${ACCEPTED_FILE_TYPES.map((t) => t.replace("image/", ".")).join(", ")}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{`Max size: ${MAX_SIZE / (1024 * 1024)}MB`}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="flex gap-2 justify-end mt-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCropOpen(true)}
                    disabled={submitting}
                    className="px-6"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFilePicker}
                    disabled={submitting}
                  >
                    Change
                  </Button>
                </div>
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={previewImage}
                    alt="Cropped preview"
                    className="w-full h-87 object-cover"
                    style={{ aspectRatio: ASPECT_RATIO }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: Use “Edit” to re-crop before uploading
                </p>
              </div>
            )}

            <div className="min-h-1">
              {error && (
                <p className="text-xs text-red-600 font-medium">{error}</p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!blob || submitting || showSuccess}
            >
              {submitting ? "Uploading..." : "Upload"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Crop Image</h3>
            </div>

            <div className="relative w-full h-88 rounded-xl overflow-hidden border">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={ASPECT_RATIO}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="flex items-center gap-4 my-2">
              <ZoomOut className="h-4 w-4" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(v) => setZoom(v[0])}
              />
              <ZoomIn className="h-4 w-4" />
            </div>

            <div className="flex justify-end gap-2 my-0.5">
              <Button
                variant="outline"
                onClick={() => setIsCropOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={applyCrop} disabled={submitting}>
                Apply
              </Button>
            </div>
          </div>
        )}

        {showSuccess && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center
            rounded-2xl bg-green-500/20 dark:bg-green-700/20
            backdrop-blur-md animate-fade-in"
          >
            <CheckCircle2 className="h-10 w-10 mb-2 text-green-700 dark:text-green-400 animate-bounce" />
            <p className="font-bold text-lg text-green-700 dark:text-green-300">
              Profile Updated!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
