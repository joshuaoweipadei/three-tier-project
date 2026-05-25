import { useState, useCallback } from "react";
import { api } from "@/lib/axios";

interface UploadResult {
  url:          string;
  filename:     string;
  originalName: string;
  size:         number;
  mimetype:     string;
}

interface UseUploadReturn {
  upload:     (file: File, type: "resume" | "avatar") => Promise<UploadResult>;
  isUploading: boolean;
  progress:    number;
  error:       string | null;
  reset:       () => void;
}

export function useUpload(): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [error,       setError]       = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, type: "resume" | "avatar"): Promise<UploadResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append(type, file);

      try {
        const { data } = await api.post<{
          success: boolean;
          data: UploadResult;
        }>(`/uploads/${type}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setProgress(Math.round((evt.loaded * 100) / evt.total));
            }
          },
        });

        setProgress(100);
        return data.data;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ?? "Upload failed. Please try again.";
        setError(message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return { upload, isUploading, progress, error, reset };
}