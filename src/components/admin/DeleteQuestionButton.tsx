"use client";

import { deleteQuestion } from "@/app/admin/(skyddad)/actions";

export function DeleteQuestionButton({ id }: { id: string }) {
  return (
    <form
      action={deleteQuestion}
      onSubmit={(e) => {
        if (!confirm("Ta bort frågan för alltid? Det går inte att ångra.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="rounded-full border-2 border-wrong-line px-4 py-2 text-sm font-bold text-wrong">
        Ta bort frågan
      </button>
    </form>
  );
}
