import { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { v4 as uuidv4 } from 'uuid';
import { Camera, X } from 'lucide-react';

interface Sticker {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
}

export default function StickerBoard() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('my-stickers');
    if (saved) {
      try {
        setStickers(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse stickers', e);
      }
    }
  }, []);

  // Save to local storage whenever stickers change
  useEffect(() => {
    localStorage.setItem('my-stickers', JSON.stringify(stickers));
  }, [stickers]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newSticker: Sticker = {
        id: uuidv4(),
        dataUrl,
        x: window.innerWidth / 2 - 120, // Center roughly
        y: Math.max(200, window.scrollY + 200),
        width: 240, // Large square default
        height: 240,
      };
      setStickers((prev) => [...prev, newSticker]);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setStickers((prev) =>
      prev.map((sticker) => (sticker.id === id ? { ...sticker, ...updates } : sticker))
    );
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {stickers.map((sticker) => (
          <Rnd
            key={sticker.id}
            className="pointer-events-auto group touch-none"
            position={{ x: sticker.x, y: sticker.y }}
            size={{ width: sticker.width, height: sticker.height }}
            onDragStop={(e, d) => updateSticker(sticker.id, { x: d.x, y: d.y })}
            onResizeStop={(e, direction, ref, delta, position) => {
              updateSticker(sticker.id, {
                width: ref.style.width,
                height: ref.style.height,
                ...position,
              });
            }}
            bounds="window"
            enableResizing={{
              top: false, right: false, bottom: false, left: false,
              topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
            }}
          >
            <div className="relative w-full h-full bg-[#1A1A1A] rounded-[36px] overflow-hidden border-[6px] border-[#1A1A1A] shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
              <img
                src={sticker.dataUrl}
                alt="sticker"
                className="w-full h-full object-cover filter select-none pointer-events-none"
                draggable={false}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSticker(sticker.id);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 hover:bg-red-500 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </Rnd>
        ))}
      </div>

      <div className="fixed bottom-10 right-[calc(50%-100px)] z-50">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 bg-[#333333] rounded-full flex items-center justify-center text-white shadow-xl hover:bg-[#444444] hover:scale-110 active:scale-95 transition-all group border-2 border-transparent hover:border-white/20"
          title="Thêm ảnh Locket"
        >
          <Camera className="w-7 h-7" />
        </button>
      </div>
    </>
  );
}
