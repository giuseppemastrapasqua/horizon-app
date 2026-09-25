"use client";

import { useRouter } from "next/navigation";

import {
  type FormEvent,
  useRef,
  useState,
} from "react";


import { SortablePhotoGrid } from "./SortablePhotoGrid";

type PropertyPhoto = {
  id: string;
  url: string;
  filename: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
};

type PrepareUploadResult = {
  key: string;
  signedUrl: string;
  token: string;
};

type PropertyPhotosSectionProps = {
  propertyId: string;
  images: PropertyPhoto[];
  prepareUploadAction: (input: {
    propertyId: string;
    originalFilename: string;
    mimeType: string;
    size: number;
  }) => Promise<PrepareUploadResult>;
  finalizeUploadAction: (input: {
    propertyId: string;
    key: string;
    originalFilename: string;
    mimeType: string;
    size: number;
  }) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  coverAction: (formData: FormData) => Promise<void>;
  reorderAction?: (
    imageIds: string[],
    propertyId: string,
  ) => Promise<void>;
};

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function PropertyPhotosSection({
  propertyId,
  images,
  prepareUploadAction,
  finalizeUploadAction,
  deleteAction,
  coverAction,
  reorderAction,
}: PropertyPhotosSectionProps) {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState<string | null>(null);

  const [uploadError, setUploadError] =
    useState<string | null>(null);

  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const files = Array.from(
      fileInputRef.current?.files ?? [],
    );

    setUploadError(null);

    if (files.length === 0) {
      setUploadError(
        "Seleziona almeno un'immagine da caricare.",
      );
      return;
    }

    if (files.length > MAX_FILES) {
      setUploadError(
        "Puoi caricare al massimo 20 immagini alla volta.",
      );
      return;
    }

    for (const file of files) {
      if (file.size <= 0) {
        setUploadError(
          `L'immagine "${file.name}" è vuota.`,
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `L'immagine "${file.name}" supera la dimensione massima di 10 MB.`,
        );
        return;
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        setUploadError(
          `L'immagine "${file.name}" ha un formato non supportato.`,
        );
        return;
      }
    }

    setIsUploading(true);

    try {
      for (
        let index = 0;
        index < files.length;
        index += 1
      ) {
        const file = files[index];

        setUploadProgress(
          `Caricamento foto ${index + 1} di ${files.length}...`,
        );

        const prepared =
          await prepareUploadAction({
            propertyId,
            originalFilename: file.name,
            mimeType: file.type,
            size: file.size,
          });

        const formData = new FormData();
        formData.append(
          "cacheControl",
          "3600",
        );
        formData.append(
          "",
          file,
        );

        const response = await fetch(
          prepared.signedUrl,
          {
            method: "PUT",
            headers: {
              "x-upsert": "false",
            },
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Upload diretto non riuscito per "${file.name}" (${response.status}).`,
          );
        }

        await finalizeUploadAction({
          propertyId,
          key: prepared.key,
          originalFilename: file.name,
          mimeType: file.type,
          size: file.size,
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }


      router.refresh();
      setUploadProgress(
        files.length === 1
          ? "Foto caricata correttamente."
          : `${files.length} foto caricate correttamente.`,
      );
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Impossibile caricare le foto selezionate.",
      );
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section
      id="foto"
      className="scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
            02
          </span>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Foto dell&apos;immobile
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Gestisci la copertina e la galleria utilizzate nella scheda
              pubblica, nel marketplace e nei portali collegati.
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
          {images.length === 1 ? "1 foto" : `${images.length} foto`}
        </span>
      </div>

      <form
        onSubmit={handleUpload}
        className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200">
          +
        </div>

        <h3 className="mt-5 text-lg font-semibold text-slate-900">
          Carica le foto
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Seleziona una o più immagini dell&apos;alloggio. Sono accettati file
          JPG, PNG e WebP, fino a 20 foto alla volta e massimo 10 MB per file.
        </p>

        <div className="mx-auto mt-6 max-w-lg text-left">
          <label
            htmlFor="property-image"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Immagine
          </label>

          <input
            ref={fileInputRef}
            id="property-image"
            name="files"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
            disabled={isUploading}
            className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:border-r file:border-slate-200 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading
            ? "Caricamento in corso..."
            : "Carica foto selezionate"}
        </button>

        {uploadProgress ? (
          <p
            className="mt-3 text-sm font-medium text-emerald-700"
            aria-live="polite"
          >
            {uploadProgress}
          </p>
        ) : null}

        {uploadError ? (
          <p
            className="mt-3 text-sm font-medium text-red-700"
            role="alert"
          >
            {uploadError}
          </p>
        ) : null}

        {!uploadProgress && !uploadError ? (
          <p className="mt-3 text-xs text-slate-500">
            La prima immagine caricata sarà impostata automaticamente come
            copertina.
          </p>
        ) : null}
      </form>

      <div className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Galleria
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Trascina le immagini usando la maniglia per modificarne
              l&apos;ordine di pubblicazione.
            </p>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              Nessuna foto caricata
            </p>

            <p className="mt-1 text-sm text-slate-500">
              La prima immagine caricata diventerà la copertina
              dell&apos;immobile.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <SortablePhotoGrid
              propertyId={propertyId}
              images={images}
              deleteAction={deleteAction}
              coverAction={coverAction}
              reorderAction={reorderAction}
            />
          </div>
        )}
      </div>
    </section>
  );
}
