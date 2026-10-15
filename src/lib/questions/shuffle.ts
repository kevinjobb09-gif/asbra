/**
 * Blandar svarsalternativen och håller reda på var det rätta svaret hamnar.
 * Används så att rätt svar inte oftast står på samma plats.
 */
export function shuffleOptions(
  options: string[],
  correctIndex: number,
  random: () => number = Math.random,
): { options: string[]; correctIndex: number } {
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    options: order.map((i) => options[i]),
    correctIndex: order.indexOf(correctIndex),
  };
}
