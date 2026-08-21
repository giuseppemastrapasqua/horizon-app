"use client";

import { SortablePhotoGrid } from "./SortablePhotoGrid";

type PropertyPhoto = {
  id: string;
  url: string;
  filename: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
};

type PropertyPhotosSectionProps = {
  propertyId: string;
  images: PropertyPhoto[];
  uploadAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  coverAction: (formData: FormData) => Promise<void>;
  reorderAction?: (
    imageIds: string[],
    propertyId: string,
  ) => Promise<void>;
};

export function PropertyPhotosSection({
  propertyId,
  images,
  uploadAction,
  deleteAction,
  coverAction,
  reorderAction,
}: PropertyPhotosSectionProps) {
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
        action={uploadAction}
        className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"
      >
        <input
          type="hidden"
          name="propertyId"
          value={propertyId}
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200">
          +
        </div>

        <h3 className="mt-5 text-lg font-semibold text-slate-900">
          Carica una foto
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Seleziona un&apos;immagine dell&apos;alloggio. Sono accettati file
          JPG, PNG e WebP con una dimensione massima di 10 MB.
        </p>

        <div className="mx-auto mt-6 max-w-lg text-left">
          <label
            htmlFor="property-image"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Immagine
          </label>

          <input
            id="property-image"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:border-r file:border-slate-200 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-200"
          />
        </div>

        <button
          type="submit"
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Carica foto
        </button>

        <p className="mt-3 text-xs text-slate-500">
          La prima immagine caricata sarà impostata automaticamente come
          copertina.
        </p>
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
