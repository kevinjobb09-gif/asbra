import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  /** Orange: används för "Börja öva" och köp. */
  cta: "bg-cta text-white hover:bg-cta-dark shadow-md shadow-cta/25",
  primary: "bg-primary text-white hover:bg-primary-dark",
  outline: "border-2 border-line bg-surface text-ink hover:border-primary",
};

type Props = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: "md" | "lg";
};

export function ButtonLink({ variant = "cta", size = "md", className = "", ...props }: Props) {
  const sizing = size === "lg" ? "px-7 py-4 text-lg" : "px-5 py-3 text-base";
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors ${sizing} ${variants[variant]} ${className}`}
    />
  );
}
