import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import LakeFreshImage from "@/components/lf/LakeFreshImage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LF_MAX_PRODUCT_IMAGES } from "@/lib/lfImages";

type LFImageGalleryInputProps = {
  value: string[];
  onChange: (images: string[]) => void;
  folder: "fish" | "spices";
  label?: string;
};

const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "photo";

const safeExtension = (file: File) => {
  const fromName = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return fromName || "jpg";
};

const LFImageGalleryInput = ({
  value,
  onChange,
  folder,
  label = "Product photos",
}: LFImageGalleryInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const images = value ?? [];

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = LF_MAX_PRODUCT_IMAGES - images.length;
    if (room <= 0) {
      toast({ title: `You can keep up to ${LF_MAX_PRODUCT_IMAGES} photos`, variant: "destructive" });
      return;
    }

    const chosen = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, room);
    if (chosen.length === 0) {
      toast({ title: "Choose image files", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of chosen) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each photo must be 5 MB or less");
        }
        const path = `lf/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(file.name)}.${safeExtension(file)}`;
        const extension = safeExtension(file);
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || `image/${extension === "jpg" ? "jpeg" : extension}`,
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      onChange([...images, ...uploaded]);
      toast({ title: `${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} added` });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Could not upload photos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (index: number) => onChange(images.filter((_, itemIndex) => itemIndex !== index));

  const move = (index: number, step: number) => {
    const nextIndex = index + step;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-500">
            Up to {LF_MAX_PRODUCT_IMAGES} photos. The first photo is the cover.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= LF_MAX_PRODUCT_IMAGES}
          className="inline-flex items-center gap-2 rounded-lg border border-[#073B78] px-3 py-2 text-xs font-bold text-[#073B78] disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Add photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => void uploadFiles(event.target.files)}
        />
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <LakeFreshImage
                src={image}
                alt={`${label} ${index + 1}`}
                className="h-24 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="text-[11px] font-bold text-gray-600">
                  {index === 0 ? "Cover" : `Photo ${index + 1}`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move photo left"
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Move photo right"
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Remove photo"
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">
          No photos yet. Add at least one cover photo.
        </p>
      )}
    </div>
  );
};

export default LFImageGalleryInput;
