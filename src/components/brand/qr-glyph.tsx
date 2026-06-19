import { cn } from "@/lib/utils";

// Decorative QR-style glyph (not a real code) for marketing visuals.
const PATTERN = [
  "1111111011101111111",
  "1000001010101000001",
  "1011101000101011101",
  "1011101011101011101",
  "1011101010001011101",
  "1000001011101000001",
  "1111111010101111111",
  "0000000011100000000",
  "1101011101011010110",
  "0100010001110101001",
  "1110111011001010111",
  "0011000110101110010",
  "1010111000111001011",
  "0000000101101101010",
  "1111111010001011101",
  "1000001011101110001",
  "1011101000101010111",
  "1011101011100100010",
  "1111111001011101011",
];

export function QrGlyph({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid aspect-square w-full overflow-hidden rounded-[6px] bg-white p-[6%]",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(${PATTERN[0].length}, 1fr)`,
        gridTemplateRows: `repeat(${PATTERN.length}, 1fr)`,
      }}
      aria-hidden="true"
    >
      {PATTERN.flatMap((row, y) =>
        row.split("").map((cell, x) => (
          <span
            key={`${x}-${y}`}
            className={cell === "1" ? "bg-onyx" : "bg-transparent"}
          />
        )),
      )}
    </div>
  );
}
