import { cn } from "@/lib/utils";
import { Check, Copy, Trash2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ImageUploader({
  aspectRatio = 1,
  maxSize = 5 * 1024 * 1024,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  className,
  onImageCropped,
}) {
  const [image, setImage] = useState(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const inputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;

    setError(null);

    if (!acceptedFileTypes.includes(file.type)) {
      setError(`File type not supported. Accepted types: ${acceptedFileTypes.join(", ")}`);
      return;
    }

    if (file.size > maxSize) {
      setError(`File is too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setIsCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const cropImage = useCallback(async () => {
    if (!image || !croppedAreaPixels) return;

    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = image;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      croppedAreaPixels.x * scaleX,
      croppedAreaPixels.y * scaleY,
      croppedAreaPixels.width * scaleX,
      croppedAreaPixels.height * scaleY,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setPreviewImage(previewUrl);
        onImageCropped?.(blob);
        setIsCropDialogOpen(false);
      },
      "image/jpeg",
      0.92
    );
  }, [image, croppedAreaPixels, onImageCropped]);

  const copyComponentCode = () => {
    const code = `import { ImageUploader } from "@/components/ImageUploader";

<ImageUploader onImageCropped={(blob) => console.log(blob)} />`;

    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const clearImage = () => {
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setImage(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Image Uploader
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="outline" onClick={copyComponentCode}>
                      {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isCopied ? "Copied!" : "Copy component code"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {previewImage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={clearImage}>
                        <Trash2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear image</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!previewImage ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/20 transition-colors"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={acceptedFileTypes.join(",")}
                onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Drag and drop an image here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {`Accepted formats: ${acceptedFileTypes.map((t) => t.replace("image/", ".")).join(", ")}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{`Max size: ${maxSize / (1024 * 1024)}MB`}</p>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={previewImage}
                alt="Cropped preview"
                className="w-full h-auto rounded-lg object-cover"
                style={{ aspectRatio }}
              />
              <Button className="absolute bottom-4 right-4" onClick={() => setIsCropDialogOpen(true)}>
                Edit
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">Upload an image to preview and crop</p>
        </CardFooter>
      </Card>

      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>

          {image && (
            <>
              <div className="relative w-full h-80">
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="flex items-center gap-4">
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={cropImage}>Apply</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}