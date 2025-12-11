import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCw, Move } from 'lucide-react';

export default function ImageCropper({ file, open, onOpenChange, onCropComplete, aspectRatio = 1 }) {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          imageRef.current = img;
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging && image) {
      setCrop({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, crop]);

  const getCroppedImage = async () => {
    if (!image) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    const containerWidth = 300;
    const containerHeight = 300;
    const scale = image.width / containerWidth;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(-size / 2, -size / 2);

    const offsetX = (crop.x * scale) / zoom;
    const offsetY = (crop.y * scale) / zoom;

    ctx.drawImage(
      image,
      -offsetX,
      -offsetY,
      (image.width / zoom),
      (image.height / zoom)
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    const croppedBlob = await getCroppedImage();
    if (croppedBlob) {
      const croppedFile = new File([croppedBlob], file.name, { type: 'image/jpeg' });
      onCropComplete(croppedFile);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas Area */}
          <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ width: 300, height: 300, margin: '0 auto' }}>
            {image && (
              <div
                className="absolute inset-0 cursor-move"
                onMouseDown={handleMouseDown}
                style={{
                  backgroundImage: `url(${image.src})`,
                  backgroundSize: `${image.width * zoom}px ${image.height * zoom}px`,
                  backgroundPosition: `${crop.x}px ${crop.y}px`,
                  backgroundRepeat: 'no-repeat',
                  transform: `rotate(${rotation}deg)`
                }}
              />
            )}
            {/* Circle Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <svg width="300" height="300">
                <defs>
                  <mask id="hole">
                    <rect width="300" height="300" fill="white" />
                    <circle cx="150" cy="150" r="140" fill="black" />
                  </mask>
                </defs>
                <rect width="300" height="300" fill="black" opacity="0.5" mask="url(#hole)" />
                <circle cx="150" cy="150" r="140" fill="none" stroke="white" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" /> Zoom
                </span>
                <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0])}
                min={1}
                max={3}
                step={0.1}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <RotateCw className="w-4 h-4" /> Rotation
                </span>
                <span className="text-sm text-gray-500">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(v) => setRotation(v[0])}
                min={0}
                max={360}
                step={1}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            <Move className="w-3 h-3" /> Drag to reposition
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-pink-500 to-orange-500 text-white">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}