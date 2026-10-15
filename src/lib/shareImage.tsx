import { ImageResponse } from "next/og";
import { brand } from "@/config";
import type { PracticeQuestion } from "@/lib/practice/session";

const LETTERS = "ABCD";

/**
 * Ritar en bild med en fråga. Används för förhandsbilden när en länk delas
 * (1200×630) och för "Dagens fråga" i TikTok/Instagram-format (1080×1920).
 * Allt på bilden är på svenska, som på provet.
 */
export function renderQuestionImage(
  question: Pick<PracticeQuestion, "question" | "options" | "correct_index">,
  { width, height, title, showAnswer = false }: { width: number; height: number; title: string; showAnswer?: boolean },
) {
  const tall = height > width;
  const scale = tall ? 1.6 : 1;
  const qSize = Math.round((question.question.length > 90 ? 40 : 48) * scale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: tall ? "center" : "space-between",
          gap: tall ? 60 : 0,
          padding: tall ? 90 : 60,
          background: brand.colors.background,
          color: "#1d1b2e",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64 * scale,
              height: 64 * scale,
              borderRadius: 16 * scale,
              background: brand.colors.primary,
              color: "white",
              fontSize: 36 * scale,
              fontWeight: 800,
            }}
          >
            {brand.initial}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30 * scale, fontWeight: 800, color: brand.colors.primary }}>{brand.name}</div>
            <div style={{ fontSize: 22 * scale, color: "#5d5a73" }}>{title}</div>
          </div>
        </div>

        <div style={{ fontSize: qSize, fontWeight: 800, lineHeight: 1.25 }}>{question.question}</div>

        <div style={{ display: "flex", flexDirection: tall ? "column" : "row", flexWrap: "wrap", gap: 16 * scale }}>
          {question.options.map((option, i) => {
            const correct = showAnswer && i === question.correct_index;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14 * scale,
                  width: tall ? "100%" : "48%",
                  padding: `${14 * scale}px ${18 * scale}px`,
                  borderRadius: 18 * scale,
                  border: `${3 * scale}px solid ${correct ? "#22c55e" : "#ebe4d8"}`,
                  background: correct ? "#dcfce7" : "white",
                  fontSize: 26 * scale,
                  fontWeight: correct ? 800 : 500,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42 * scale,
                    height: 42 * scale,
                    borderRadius: 999,
                    background: correct ? "#22c55e" : "#efebff",
                    color: correct ? "white" : brand.colors.primary,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {correct ? "✓" : LETTERS[i]}
                </div>
                <div style={{ display: "flex" }}>{option}</div>
              </div>
            );
          })}
        </div>

        {tall && (
          <div style={{ fontSize: 30 * scale, color: "#5d5a73", textAlign: "center", justifyContent: "center", display: "flex" }}>
            {showAnswer ? "Visste du svaret?" : "Skriv ditt svar i kommentarerna!"}
          </div>
        )}
      </div>
    ),
    { width, height },
  );
}
