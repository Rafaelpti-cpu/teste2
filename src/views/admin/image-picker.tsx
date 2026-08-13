"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { uploadImage } from "@/lib/admin/client";
import { shrinkForUpload } from "@/lib/admin/resize-image";

export interface ImagePickerProps {
  value: string[];
  onChange: (images: string[]) => void;
}

/**
 * The product's photo gallery.
 *
 * Built for a phone, because that is where the shop adds pieces: one big
 * "Adicionar fotos" target instead of the browser's tiny default file button,
 * a separate shortcut straight to the camera, and per-photo controls sized for
 * a thumb rather than a mouse.
 *
 * Order is meaningful — the first photo is the cover on the site and the second
 * is what shows on hover — so the list reorders rather than being a plain set.
 */
export const ImagePicker = ({ value, onChange }: ImagePickerProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setPending(files.length);
    setDone(0);

    const uploaded: string[] = [];
    const failed: string[] = [];
    /*
      The server's own words, kept for the message.

      "Não consegui enviar X.jpeg" was true and useless: it named the file,
      which the shop can see, and hid the reason, which only the server knows.
      When the bucket was misconfigured this screen said nothing for days while
      the API had been answering exactly what was wrong the whole time.
    */
    let reason: string | null = null;

    for (const file of Array.from(files)) {
      try {
        // Shrunk here, on the phone, before a single byte goes out — see
        // `shrinkForUpload` for why this is load-bearing and not a nicety.
        uploaded.push(await uploadImage(await shrinkForUpload(file)));
      } catch (cause) {
        failed.push(file.name);
        if (!reason && cause instanceof Error && cause.message) {
          reason = cause.message;
        }
        // Keep going: one bad photo must not cost the whole batch.
        console.error("[admin] upload falhou", cause);
      } finally {
        setDone((count) => count + 1);
      }
    }

    if (uploaded.length > 0) onChange([...value, ...uploaded]);
    if (failed.length > 0) {
      const what =
        failed.length === 1
          ? `Não consegui enviar "${failed[0]}"`
          : `Não consegui enviar ${failed.length} fotos`;
      setError(reason ? `${what}. ${reason}` : `${what}.`);
    }

    setPending(0);
    setDone(0);
    // Let the same file be chosen again after a failure.
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const busy = pending > 0;
  const trigger =
    "flex flex-1 items-center justify-center gap-2 rounded-control border border-border-strong px-4 py-3.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-surface-inverse hover:text-foreground-inverse disabled:opacity-50";
  const nudge =
    "flex size-9 items-center justify-center rounded-control text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground disabled:opacity-30";

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground">
        Fotos{" "}
        <span className="font-normal text-foreground-muted">
          — a primeira é a capa
        </span>
      </span>

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((src, index) => (
            <li
              key={src}
              className="flex flex-col gap-1 rounded-card border border-border-subtle p-2"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-control bg-surface-muted">
                <Image
                  src={src}
                  alt={`Foto ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 45vw, 12rem"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-1 left-1 rounded-pill bg-action-primary px-2 py-0.5 text-[0.625rem] text-action-primary-foreground">
                    Capa
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Mover a foto ${index + 1} para trás`}
                  className={nudge}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  aria-label={`Remover a foto ${index + 1}`}
                  className="rounded-control px-2 py-2 text-xs text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-foreground-accent"
                >
                  Remover
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === value.length - 1}
                  aria-label={`Mover a foto ${index + 1} para frente`}
                  className={nudge}
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* The inputs stay off-screen; the buttons above them are the real
          target. A bare file input is a ~30px tap area on a phone. */}
      <input
        ref={fileRef}
        id="product-images"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        onChange={(event) => void handleFiles(event.target.files)}
        className="sr-only"
      />
      <input
        ref={cameraRef}
        id="product-camera"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => void handleFiles(event.target.files)}
        className="sr-only"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className={trigger}
        >
          {busy ? `Enviando ${done}/${pending}…` : "Adicionar fotos"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          className={`${trigger} sm:max-w-[12rem]`}
        >
          Tirar foto
        </button>
      </div>

      <p className="text-xs text-foreground-muted">
        Dá para escolher várias de uma vez. JPG, PNG, WebP ou AVIF, até 8 MB
        cada — o celular já encolhe a foto antes de enviar, então mesmo com
        sinal fraco costuma ser rápido. No site elas aparecem no formato 3:4
        (em pé), então fotografe a peça <strong>em pé</strong>.
      </p>

      {error && (
        <p role="alert" className="text-xs text-foreground-accent">
          {error}
        </p>
      )}
    </div>
  );
};
