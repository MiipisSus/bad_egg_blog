"use client"

import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Lock, Unlock, X } from "lucide-react"

interface ImageCropperProps {
  imageSrc: string
  defaultAspect?: number // e.g. 3/2, 16/9, 1
  onCrop: (croppedBlob: Blob) => void
  onCancel: () => void
}

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  canvas.width = Math.round(crop.width * scaleX)
  canvas.height = Math.round(crop.height * scaleY)

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(
    image,
    Math.round(crop.x * scaleX),
    Math.round(crop.y * scaleY),
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png", 1)
  })
}

export function ImageCropper({ imageSrc, defaultAspect, onCrop, onCancel }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [locked, setLocked] = useState(!!defaultAspect)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  const currentAspect = locked ? defaultAspect : undefined

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget
      imgRef.current = img
      const { width, height } = img

      // Set initial crop centered
      const aspect = locked ? defaultAspect : undefined
      if (aspect) {
        const imgAspect = width / height
        let cropW: number, cropH: number
        if (imgAspect > aspect) {
          cropH = height * 0.85
          cropW = cropH * aspect
        } else {
          cropW = width * 0.85
          cropH = cropW / aspect
        }
        setCrop({
          unit: "px",
          x: (width - cropW) / 2,
          y: (height - cropH) / 2,
          width: cropW,
          height: cropH,
        })
      } else {
        const size = Math.min(width, height) * 0.85
        setCrop({
          unit: "px",
          x: (width - size) / 2,
          y: (height - size) / 2,
          width: size,
          height: size,
        })
      }
    },
    [defaultAspect, locked],
  )

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return
    const blob = await getCroppedBlob(imgRef.current, completedCrop)
    onCrop(blob)
  }, [completedCrop, onCrop])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold">裁切圖片</h3>
          <button onClick={onCancel} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative flex-1 overflow-auto bg-neutral-100 p-4">
          <div className="relative flex items-center justify-center">
            <div className="relative">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={currentAspect}
                className="max-h-[60vh]"
              >
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-h-[60vh] w-auto"
                />
              </ReactCrop>

              {/* Lock/Unlock button — inside crop box top-right */}
              {crop && (
                <button
                  onClick={() => setLocked((v) => !v)}
                  className="absolute z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded bg-black/60 text-white transition-colors hover:bg-black/80"
                  style={{
                    top: crop.unit === "px" ? crop.y + 6 : `calc(${crop.y}% + 6px)`,
                    left: crop.unit === "px" ? crop.x + crop.width - 6 - 28 : `calc(${crop.x + crop.width}% - 34px)`,
                  }}
                  title={locked ? "解鎖比例" : "鎖定比例"}
                >
                  {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {locked && defaultAspect
              ? `固定比例 ${defaultAspect >= 1 ? `${Math.round(defaultAspect * 100) / 100}:1` : `1:${Math.round((1 / defaultAspect) * 100) / 100}`}`
              : "自由裁切"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="cursor-pointer rounded-lg border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={!completedCrop}
              className="cursor-pointer rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-40"
            >
              確認裁切
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
