/**
 * Testar provsimuleringen som en användare upplever den, med en låtsasklocka
 * så att 90 minuter kan spolas fram på ett ögonblick.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ExamSession } from "@/components/exam/ExamSession";
import type { PracticeQuestion } from "@/lib/practice/session";

const questions: PracticeQuestion[] = [1, 2, 3].map((n) => ({
  id: `q${n}`,
  chapter: n,
  section: "",
  question: `Testfråga ${n}`,
  options: ["Alt A", "Alt B", "Alt C", "Alt D"],
  correct_index: 0,
  explanation: "Förklaring",
  source_reference: "Källa",
}));

function renderExam(timeLimitSeconds = 60) {
  return render(
    <ExamSession
      pool={questions}
      questionCount={60}
      timeLimitSeconds={timeLimitSeconds}
      passThreshold={null}
      chapters={[1, 2, 3].map((n) => ({ number: n, title: `Kapitel ${n}` }))}
      country="se"
      officialInfoUrl="https://www.uhr.se"
      preview
    />,
  );
}

const timer = () => screen.getByRole("timer").textContent?.trim();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T10:00:00Z"));
  window.scrollTo = vi.fn();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("provsimulering", () => {
  it("visar hela tiden när provet startar", () => {
    renderExam(90 * 60);
    fireEvent.click(screen.getByText("Starta provet"));
    expect(timer()).toBe("1:30:00");
  });

  it("räknar ner och lämnar in automatiskt när tiden är slut", () => {
    renderExam(60);
    fireEvent.click(screen.getByText("Starta provet"));
    fireEvent.click(screen.getByText("Alt A")); // rätt svar på fråga 1

    act(() => vi.advanceTimersByTime(30_000));
    expect(timer()).toBe("0:30");

    act(() => vi.advanceTimersByTime(29_000));
    expect(timer()).toBe("0:01");
    expect(screen.queryByText(/Tiden tog slut/)).toBeNull(); // inte inlämnat än

    act(() => vi.advanceTimersByTime(1_500));
    expect(screen.getByText(/Tiden tog slut/)).toBeTruthy();
    expect(screen.getByText("1 av 3 rätt")).toBeTruthy();
  });

  it("visar inget resultat före inlämning", () => {
    renderExam(60);
    fireEvent.click(screen.getByText("Starta provet"));
    fireEvent.click(screen.getByText("Alt B")); // fel svar
    expect(screen.queryByText(/rätt/i)).toBeNull();
    expect(screen.queryByText("Förklaring")).toBeNull();
  });

  it("man kan byta svar innan man lämnar in", () => {
    renderExam(60);
    fireEvent.click(screen.getByText("Starta provet"));
    fireEvent.click(screen.getByText("Alt B"));
    fireEvent.click(screen.getByText("Alt A"));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByText("Översikt"));
    fireEvent.click(screen.getByText("Lämna in provet"));
    expect(screen.getByText("1 av 3 rätt")).toBeTruthy();
  });

  it("frågar innan inlämning om frågor är obesvarade, och avbryter om man säger nej", () => {
    renderExam(60);
    fireEvent.click(screen.getByText("Starta provet"));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByText("Översikt"));
    fireEvent.click(screen.getByText("Lämna in provet"));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("3 obesvarade"));
    expect(screen.queryByText(/av 3 rätt/)).toBeNull();
  });

  it("klockan fortsätter där den var om sidan laddas om", () => {
    const first = renderExam(60);
    fireEvent.click(screen.getByText("Starta provet"));
    act(() => vi.advanceTimersByTime(20_000));
    first.unmount();

    renderExam(60); // som en omladdning
    expect(timer()).toBe("0:40");
  });

  it("lämnar in direkt om tiden tog slut medan man var borta", () => {
    const first = renderExam(60);
    fireEvent.click(screen.getByText("Starta provet"));
    fireEvent.click(screen.getByText("Alt A"));
    first.unmount();

    vi.setSystemTime(Date.now() + 5 * 60_000); // fem minuter senare
    renderExam(60);
    expect(screen.getByText(/Tiden tog slut/)).toBeTruthy();
    expect(screen.getByText("1 av 3 rätt")).toBeTruthy();
  });
});
