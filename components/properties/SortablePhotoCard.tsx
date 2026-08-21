"use client";

import Image from "next/image";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type SortablePropertyPhoto = {
  id: string;
  url: string;
  filename: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
};

type SortablePhotoCardProps = {
  propertyId: string;
  image: SortablePropertyPhoto;
  position: number;
  deleteAction: (formData: FormData) => Promise<void>;
  coverAction: (formData: FormData) => Promise<void>;
};

export function SortablePhotoCard({
  propertyId,
  image,
  position,
  deleteAction,
  coverAction,
}: SortablePhotoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        "overflow-hidden rounded-xl border bg-white shadow-sm",
        isDragging
          ? "border-slate-400 shadow-lg"
          : "border-slate-200",
      ].join(" ")}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={image.url}
          alt={
            image.caption ??
            `Foto ${position} dell'immobile`
          }
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover"
        />

        {image.isCover ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-blue-700/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
            Copertina
          </span>
        ) : null}

        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm backdrop-blur">
          {position}
        </span>

        <button
          type="button"
          aria-label={`Sposta la foto in posizione ${position}`}
          {...attributes}
          {...listeners}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-lg bg-white/95 text-base font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:cursor-grabbing"
        >
          ⋮⋮
        </button>
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-medium text-slate-900">
          {image.caption || image.filename}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          Posizione {position}
        </p>

        {!image.isCover ? (
          <form
            action={coverAction}
            className="mt-3 border-t border-slate-100 pt-3"
          >
            <input
              type="hidden"
              name="propertyId"
              value={propertyId}
            />

            <input
              type="hidden"
              name="imageId"
              value={image.id}
            />

            <button
              type="submit"
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
            >
              Imposta come copertina
            </button>
          </form>
        ) : (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-500">
              Copertina attuale
            </div>
          </div>
        )}

        <form
          action={deleteAction}
          className="mt-2"
          onSubmit={(event) => {
            const confirmed = window.confirm(
              "Eliminare definitivamente questa foto?",
            );

            if (!confirmed) {
              event.preventDefault();
            }
          }}
        >
          <input
            type="hidden"
            name="propertyId"
            value={propertyId}
          />

          <input
            type="hidden"
            name="imageId"
            value={image.id}
          />

          <button
            type="submit"
            className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            Elimina foto
          </button>
        </form>
      </div>
    </article>
  );
}
