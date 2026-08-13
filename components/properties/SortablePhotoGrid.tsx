"use client";

import { useState } from "react";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";

import {
  SortablePhotoCard,
  type SortablePropertyPhoto,
} from "./SortablePhotoCard";

type SortablePhotoGridProps = {
  propertyId: string;
  images: SortablePropertyPhoto[];
  deleteAction: (
    formData: FormData,
  ) => Promise<void>;
  coverAction: (
    formData: FormData,
  ) => Promise<void>;
  reorderAction?: (
    imageIds: string[],
    propertyId: string,
  ) => Promise<void>;
  onOrderChange?: (
    images: SortablePropertyPhoto[],
  ) => void;
};

export function SortablePhotoGrid(
  props: SortablePhotoGridProps,
) {
  const imagesKey = JSON.stringify(
    props.images,
  );

  return (
    <SortablePhotoGridContent
      key={imagesKey}
      {...props}
    />
  );
}

function SortablePhotoGridContent({
  propertyId,
  images,
  deleteAction,
  coverAction,
  reorderAction,
  onOrderChange,
}: SortablePhotoGridProps) {
  const [items, setItems] =
    useState(images);

  const [isSaving, setIsSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
  );

  async function handleDragEnd(
    event: DragEndEvent,
  ) {
    const { active, over } = event;

    if (
      isSaving ||
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex = items.findIndex(
      (item) => item.id === active.id,
    );

    const newIndex = items.findIndex(
      (item) => item.id === over.id,
    );

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return;
    }

    const previousItems = items;

    const reorderedItems = arrayMove(
      items,
      oldIndex,
      newIndex,
    ).map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    setItems(reorderedItems);
    setSaveError(null);

    onOrderChange?.(
      reorderedItems,
    );

    if (!reorderAction) {
      return;
    }

    setIsSaving(true);

    try {
      await reorderAction(
        reorderedItems.map(
          (item) => item.id,
        ),
        propertyId,
      );
    } catch (error) {
      console.error(
        "Impossibile salvare il nuovo ordine delle immagini.",
        error,
      );

      setItems(previousItems);

      onOrderChange?.(
        previousItems,
      );

      setSaveError(
        "Non è stato possibile salvare il nuovo ordine. Riprova.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={
          closestCenter
        }
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(
            (item) => item.id,
          )}
          strategy={
            rectSortingStrategy
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map(
              (image, index) => (
                <SortablePhotoCard
                  key={image.id}
                  propertyId={
                    propertyId
                  }
                  image={image}
                  position={index + 1}
                  deleteAction={
                    deleteAction
                  }
                  coverAction={
                    coverAction
                  }
                />
              ),
            )}
          </div>
        </SortableContext>
      </DndContext>

      {isSaving ? (
        <p
          className="mt-4 text-sm text-slate-500"
          aria-live="polite"
        >
          Salvataggio del nuovo ordine…
        </p>
      ) : null}

      {saveError ? (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {saveError}
        </p>
      ) : null}
    </div>
  );
}