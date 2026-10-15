import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerOption } from "@/components/AnswerOption";

describe("AnswerOption", () => {
  it("rätt svar får gröna färger", () => {
    render(<AnswerOption index={0} text="Riksdagen" state="correct" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-correct-bg");
    expect(button.className).toContain("border-correct-line");
    expect(button.textContent).toContain("rätt svar");
  });

  it("fel svar blir rött och inte grönt", () => {
    render(<AnswerOption index={1} text="Regeringen" state="wrong" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-wrong-bg");
    expect(button.className).not.toContain("correct");
  });

  it("visar bokstav A–D innan man svarat", () => {
    render(<AnswerOption index={2} text="Kommunen" />);
    expect(screen.getByRole("button").textContent).toContain("C");
  });
});
