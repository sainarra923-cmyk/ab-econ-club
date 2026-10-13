"use client";
import { useRef, useState } from "react";
import { uploadImage } from "./upload";

/** Single image picker that stores the uploaded URL in a hidden input. */
export function ImageField({
  name,
  label,
  hint,
  userId,
  initialUrl,
  shape = "wide",
  disabled = false,
}: {
  name: string;
  label: string;
  hint?: string;
  userId: string;
  initialUrl: string | null;
  shape?: "wide" | "round";
  disabled?: boolean;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setUrl(await uploadImage(file, userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-wrap items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className={shape === "round" ? "h-20 w-20 rounded-full object-cover" : "h-24 w-40 border border-rule object-cover"}
          />
        ) : (
          <div
            className={`flex items-center justify-center border border-dashed border-rule text-[0.8125rem] text-muted ${
              shape === "round" ? "h-20 w-20 rounded-full" : "h-24 w-40"
            }`}
          >
            No image
          </div>
        )}
        {!disabled && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? "Uploading" : url ? "Replace" : "Upload image"}
            </button>
            {url && (
              <button type="button" className="btn btn-quiet" onClick={() => setUrl("")}>
                Remove
              </button>
            )}
          </div>
        )}
        <input ref={input} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={onPick} />
      </div>
      {hint && <p className="hint">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
