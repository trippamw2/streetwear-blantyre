import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileText, Image as ImageIcon, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import LakeFreshImage from "@/components/lf/LakeFreshImage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { deleteLfStorageAsset, LF_STORAGE_BUCKET } from "@/lib/lfStorage";

const FOLDER = "lf/files";
const MAX_BYTES = 5 * 1024 * 1024;

type StorageObject = {
  name: string;
  id: string | null;
  created_at?: string;
  updated_at?: string;
  metadata?: { size?: number };
};

const safeFileName = (name: string) =>
  name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-80) || `file-${Date.now()}`;

const formatSize = (bytes?: number) => {
  if (!bytes || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LFFileManager = () => {
  const [files, setFiles] = useState<StorageObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from(LF_STORAGE_BUCKET)
      .list(FOLDER, { limit: 200, offset: 0 });
    if (error) {
      setLoading(false);
      throw new Error(error.message);
    }
    setFiles((data || []).filter((item: any) => item.id) as StorageObject[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFiles().catch((error) => {
      toast({
        title: "Could not load files",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    });
  }, [loadFiles]);

  const uploadFiles = async (fileList: FileList | null) => {
    const chosen = Array.from(fileList || []);
    if (chosen.length === 0) return;
    setUploading(true);
    try {
      for (const file of chosen) {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        const isImage = file.type.startsWith("image/");
        if (!isPdf && !isImage) {
          throw new Error(`${file.name}: choose an image or PDF file`);
        }
        if (file.size > MAX_BYTES) {
          throw new Error(`${file.name}: files must be 5 MB or less`);
        }
        const path = `${FOLDER}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName(file.name)}`;
        const { error } = await supabase.storage.from(LF_STORAGE_BUCKET).upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
          upsert: false,
        });
        if (error) throw error;
      }
      toast({ title: `${chosen.length} file${chosen.length === 1 ? "" : "s"} uploaded` });
      await loadFiles();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (file: StorageObject) => {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    setDeleting(file.name);
    try {
      const publicUrl =
        supabase.storage.from(LF_STORAGE_BUCKET).getPublicUrl(`${FOLDER}/${file.name}`).data.publicUrl;
      const removed = await deleteLfStorageAsset(publicUrl);
      if (!removed) {
        toast({
          title: "File still in use",
          description: "Remove it from the recipe or product first.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "File deleted", description: file.name });
      await loadFiles();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Uploaded files</h2>
          <p className="mt-1 text-sm text-gray-500">
            Images and PDFs live in the Lake Fresh library. Upload, open or delete files here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadFiles().catch(() => undefined)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#073B78] px-3 py-2 text-xs font-bold text-white">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload files
            <input
              type="file"
              accept="image/*,application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(event) => {
                void uploadFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading files...
        </p>
      ) : files.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
          No uploaded files yet. Add images or PDFs for recipes, notices and product records.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => {
            const publicUrl =
              supabase.storage.from(LF_STORAGE_BUCKET).getPublicUrl(`${FOLDER}/${file.name}`).data.publicUrl;
            const isImage = /\.(png|jpe?g|webp|gif)$/i.test(file.name);
            return (
              <div key={file.name} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex h-24 items-center justify-center bg-white">
                  {isImage ? (
                    <LakeFreshImage
                      src={publicUrl}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="h-9 w-9 text-[#073B78]" aria-hidden="true" />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-start gap-2">
                    {isImage ? (
                      <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />
                    ) : (
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-800" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {formatSize(file.metadata?.size)}
                        {file.created_at ? ` | ${new Date(file.created_at).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-[10px] font-bold uppercase text-gray-700"
                    >
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                    <button
                      type="button"
                      onClick={() => void removeFile(file)}
                      disabled={deleting === file.name}
                      className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-[10px] font-bold uppercase text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> {deleting === file.name ? "Deleting" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LFFileManager;
