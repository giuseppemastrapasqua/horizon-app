"use client";

import {
  useActionState,
  type ReactNode,
} from "react";

type BookingCreateAction = (
  formData: FormData,
) => void | Promise<void>;

type BookingCreateState = {
  error: string | null;
};

type BookingCreateFormProps = {
  action: BookingCreateAction;
  children: ReactNode;
};

const initialState: BookingCreateState = {
  error: null,
};

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Non è stato possibile creare la prenotazione.";
}

export function BookingCreateForm({
  action,
  children,
}: BookingCreateFormProps) {
  const [state, formAction] = useActionState<
    BookingCreateState,
    FormData
  >(
    async (
      _previousState,
      formData,
    ): Promise<BookingCreateState> => {
      try {
        await action(formData);

        return {
          error: null,
        };
      } catch (error) {
        return {
          error: getErrorMessage(error),
        };
      }
    },
    initialState,
  );

  return (
    <form
      action={formAction}
      style={{ display: "grid", gap: "18px" }}
    >
      {state.error ? (
        <div
          role="alert"
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          {state.error}
        </div>
      ) : null}

      {children}
    </form>
  );
}