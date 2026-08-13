"use client";

import {
  useActionState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

type PropertyDocumentAction = (
  formData: FormData,
) => void | Promise<void>;

type PropertyDocumentEditorProps = {
  propertyId: string;
  documentId: string;

  ocrStatus:
    | "NOT_REQUESTED"
    | "QUEUED"
    | "PROCESSING"
    | "COMPLETED"
    | "REVIEW_REQUIRED"
    | "FAILED";

  summary: ReactNode;
  fields: ReactNode;
  attachment: ReactNode;
  deleteForm: ReactNode;
  updateAction: PropertyDocumentAction;
};

type UpdateDocumentState = {
  successfulSubmissions: number;
  error: string | null;
};

const initialUpdateDocumentState: UpdateDocumentState = {
  successfulSubmissions: 0,
  error: null,
};

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Non è stato possibile salvare il documento.";
}

export function PropertyDocumentEditor({
  propertyId,
  documentId,
  ocrStatus,
  summary,
  fields,
  attachment,
  deleteForm,
  updateAction,
}: PropertyDocumentEditorProps) {
  const router = useRouter();

  const detailsRef =
    useRef<HTMLDetailsElement>(null);

  const [
    updateState,
    updateFormAction,
  ] = useActionState<
    UpdateDocumentState,
    FormData
  >(
    async (
      previousState,
      formData,
    ): Promise<UpdateDocumentState> => {
      try {
        await updateAction(formData);

        return {
          successfulSubmissions:
            previousState.successfulSubmissions +
            1,
          error: null,
        };
      } catch (error) {
        return {
          successfulSubmissions:
            previousState.successfulSubmissions,
          error: getErrorMessage(error),
        };
      }
    },
    initialUpdateDocumentState,
  );

  useEffect(() => {
    if (
      updateState.successfulSubmissions === 0
    ) {
      return;
    }

    const details = detailsRef.current;

    if (!details) {
      return;
    }

    details.open = false;

    details.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [updateState.successfulSubmissions]);

  useEffect(() => {
    const isOcrActive =
      ocrStatus === "QUEUED" ||
      ocrStatus === "PROCESSING";

    if (!isOcrActive) {
      return;
    }

    const interval = window.setInterval(
      () => {
        router.refresh();
      },
      5000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [ocrStatus, router]);

  return (
    <details
      ref={detailsRef}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <summary className="cursor-pointer list-none px-6 py-5 transition hover:bg-slate-50">
        {summary}
      </summary>

      <div className="border-t border-slate-200 bg-slate-50 p-6">
        <form
          action={updateFormAction}
          className="space-y-6"
        >
          <input
            type="hidden"
            name="propertyId"
            value={propertyId}
          />

          <input
            type="hidden"
            name="documentId"
            value={documentId}
          />

          {fields}

          {updateState.error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {updateState.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>{attachment}</div>

            <SaveDocumentButton />
          </div>
        </form>

        {deleteForm}
      </div>
    </details>
  );
}

function SaveDocumentButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending
        ? "Salvataggio..."
        : "Salva documento"}
    </button>
  );
}