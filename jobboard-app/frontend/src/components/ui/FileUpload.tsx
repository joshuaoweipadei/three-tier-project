import { useCallback, useRef, useState } from "react";
import { Upload, File, X, CheckCircle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useUpload } from "@/hooks/use-upload";

interface FileUploadProps {
  type:        "resume" | "avatar";
  onUpload:    (url: string) => void;
  accept?:     string;
  maxSizeMB?:  number;
  label?:      string;
  currentUrl?: string | null;
}

export default function FileUpload({
  type,
  onUpload,
  accept,
  maxSizeMB = type === "resume" ? 5 : 2,
  label     = type === "resume" ? "Upload Resume" : "Upload Avatar",
  currentUrl,
}: FileUploadProps) {
  const { upload, isUploading, progress, error, reset } = useUpload();
  const [isDragging, setIsDragging]   = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl ?? null);
  const [fileName,    setFileName]    = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultAccept =
    type === "resume"
      ? ".pdf,.doc,.docx"
      : ".jpg,.jpeg,.png,.webp";

  const handleFile = useCallback(
    async (file: File) => {
      // Client-side size check before uploading
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File must be smaller than ${maxSizeMB} MB.`);
        return;
      }

      try {
        setFileName(file.name);
        const result = await upload(file, type);
        setUploadedUrl(result.url);
        onUpload(result.url);
      } catch {
        setFileName(null);
      }
    },
    [upload, type, onUpload, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearUpload = () => {
    setUploadedUrl(null);
    setFileName(null);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="label">{label}</p>

      {uploadedUrl && !isUploading ? (
        // Uploaded state
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">
              {fileName ?? "File uploaded"}
            </p>
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline"
            >
              View file
            </a>
          </div>
          <button
            type="button"
            onClick={clearUpload}
            className="text-green-500 hover:text-red-500 transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Drop zone
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            "relative border-2 border-dashed rounded-xl p-6 text-center",
            "cursor-pointer transition-all duration-150",
            isDragging
              ? "border-brand-400 bg-brand-50"
              : "border-gray-300 hover:border-brand-400 hover:bg-gray-50",
            isUploading && "pointer-events-none"
          )}
          role="button"
          tabIndex={0}
          aria-label={`Upload ${type}`}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept ?? defaultAccept}
            onChange={handleChange}
            className="sr-only"
            aria-hidden="true"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <p className="text-sm text-gray-600">Uploading… {progress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-xs">
                <div
                  className="bg-brand-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gray-100 rounded-xl">
                {type === "resume"
                  ? <File   className="w-6 h-6 text-gray-500" />
                  : <Upload className="w-6 h-6 text-gray-500" />
                }
              </div>
              <p className="text-sm font-medium text-gray-700">
                Drop file here or{" "}
                <span className="text-brand-600">browse</span>
              </p>
              <p className="text-xs text-gray-400">
                {type === "resume"
                  ? `PDF, DOC, DOCX up to ${maxSizeMB} MB`
                  : `JPG, PNG, WebP up to ${maxSizeMB} MB`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}