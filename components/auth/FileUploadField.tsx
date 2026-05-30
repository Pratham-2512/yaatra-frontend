'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;
const ACCEPT_ATTR  = '.jpg,.jpeg,.png,.pdf';

const MIME_LABEL: Record<string, string> = {
  'image/jpeg':      'JPG',
  'image/png':       'PNG',
  'application/pdf': 'PDF',
};

function fmtSize(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Progress animation ────────────────────────────────────────────────────────

const PROGRESS_STEPS = [8, 22, 40, 58, 74, 87, 95, 100];

function useUploadProgress(trigger: boolean) {
  const [pct, setPct]       = useState(0);
  const [done, setDone]     = useState(false);

  useEffect(() => {
    if (!trigger) { setPct(0); setDone(false); return; }
    let i = 0;
    setPct(0);
    setDone(false);
    const iv = setInterval(() => {
      setPct(PROGRESS_STEPS[i]);
      i++;
      if (i >= PROGRESS_STEPS.length) {
        clearInterval(iv);
        setDone(true);
      }
    }, 130);
    return () => clearInterval(iv);
  }, [trigger]);

  return { pct, done };
}

// ── FileUploadField ───────────────────────────────────────────────────────────

export interface FileUploadFieldProps {
  label: string;
  hint?: string;
  file: File | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  showPreview?: boolean;
  maxSizeMb?: number;
  required?: boolean;
}

export function FileUploadField({
  label,
  hint,
  file,
  onSelect,
  onRemove,
  showPreview = false,
  maxSizeMb = 5,
  required = false,
}: FileUploadFieldProps) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]   = useState(false);
  const [error, setError]         = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreview]  = useState<string | null>(null);

  const { pct, done } = useUploadProgress(uploading);

  // When "upload" finishes, flip uploading off
  useEffect(() => { if (done) setUploading(false); }, [done]);

  // Object-URL preview for images
  useEffect(() => {
    if (!file || !showPreview || !file.type.startsWith('image/')) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, showPreview]);

  const validate = (f: File): string => {
    if (!ALLOWED_MIME.includes(f.type as typeof ALLOWED_MIME[number]))
      return 'Only JPG, PNG or PDF files are accepted.';
    if (f.size > maxSizeMb * 1024 * 1024)
      return `File must be under ${maxSizeMb} MB.`;
    return '';
  };

  const handleFile = useCallback(
    (f: File) => {
      const err = validate(f);
      if (err) { setError(err); return; }
      setError('');
      onSelect(f);
      setUploading(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSelect, maxSizeMb]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const typeLabel = file
    ? (MIME_LABEL[file.type] ?? file.name.split('.').pop()?.toUpperCase() ?? '?')
    : null;

  const isPdf   = file?.type === 'application/pdf';
  const isImage = file?.type.startsWith('image/');

  // ── Empty state (drop zone) ─────────────────────────────────────────────────
  if (!file) {
    return (
      <div>
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
          {required && <span className="ml-1 text-orange-500">*</span>}
        </label>

        <div
          role="button"
          tabIndex={0}
          aria-label={`Upload ${label}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer select-none flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-5 text-center outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500/50 ${
            dragging
              ? 'border-orange-500/70 bg-orange-500/10 scale-[1.01]'
              : 'border-white/[0.10] bg-white/[0.02] hover:border-white/[0.20] hover:bg-white/[0.04]'
          }`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
            dragging ? 'bg-orange-500/20' : 'bg-white/[0.04]'
          }`}>
            <span className="text-xl">{dragging ? '⬇️' : '📎'}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">
              {dragging ? 'Drop file here' : 'Click or drag & drop'}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-600">
              {hint ?? 'JPG, PNG or PDF · Max 5 MB'}
            </p>
          </div>
        </div>

        {error && <p className="mt-1.5 text-[10px] text-rose-400">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          onChange={onInputChange}
          className="hidden"
          aria-hidden
        />
      </div>
    );
  }

  // ── Filled state ────────────────────────────────────────────────────────────
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
        {required && <span className="ml-1 text-orange-500">*</span>}
      </label>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-all">
        {/* Image preview */}
        {showPreview && previewUrl && (
          <div className="mb-3 overflow-hidden rounded-lg border border-white/[0.06]">
            <img
              src={previewUrl}
              alt="Profile preview"
              className="h-28 w-full object-cover"
            />
          </div>
        )}

        {/* PDF placeholder */}
        {isPdf && !previewUrl && (
          <div className="mb-3 flex items-center justify-center rounded-lg border border-rose-500/15 bg-rose-500/5 py-4">
            <span className="text-3xl opacity-60">📄</span>
          </div>
        )}

        {/* File info */}
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${
            isPdf
              ? 'bg-rose-500/15 text-rose-400'
              : 'bg-emerald-500/15 text-emerald-400'
          }`}>
            {isPdf ? '📄' : isImage ? '🖼️' : '📎'}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{file.name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
              <span className="rounded bg-white/[0.06] px-1.5 py-px font-mono text-[9px]">
                {typeLabel}
              </span>
              <span>{fmtSize(file.size)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { onRemove(); setError(''); }}
            className="shrink-0 rounded-lg border border-white/10 p-1.5 text-slate-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
            title="Remove file"
            aria-label="Remove file"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {(uploading || (pct > 0 && pct < 100)) && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[9px] text-slate-600">
              <span>Uploading…</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-cyan-400 transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Success state */}
        {!uploading && pct === 100 && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[9px]">✓</span>
            <span>File ready · verified</span>
          </div>
        )}
      </div>

      {/* Re-upload link */}
      {!uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1.5 text-[10px] text-slate-600 transition hover:text-cyan-400"
        >
          ↺ Replace file
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={onInputChange}
        className="hidden"
        aria-hidden
      />
    </div>
  );
}
