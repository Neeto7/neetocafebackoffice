"use client";

import Cropper, { Area } from "react-easy-crop";
import { useState, useCallback } from "react";
import { getCroppedImg } from "@/lib/utils/cropImage";
import { Button } from "@/components/ui/button";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (file: File) => void;
};

export default function ImageCropper({ imageSrc, onCancel, onCropComplete }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
    onCropComplete(file);
  }, [croppedAreaPixels, imageSrc, onCropComplete]);

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
      <div className="relative w-[90vw] h-[70vh] max-w-lg bg-gray-900 rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropCompleteCallback}
        />
      </div>

      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button onClick={handleConfirm} className="bg-[#0C2B4E] text-white">
          Gunakan Foto
        </Button>
      </div>
    </div>
  );
}
