const CORNERS = [
  { pos: "left-0 top-0", d: "M2 22V2h20" },
  { pos: "right-0 top-0", d: "M22 22V2H2" },
  { pos: "bottom-0 left-0", d: "M2 2v20h20" },
  { pos: "bottom-0 right-0", d: "M22 2v20H2" },
];

/** Four drawn corner marks for a viewfinder. Inherits the text colour; `inset` is a Tailwind inset class. */
export function ViewfinderCorners({ inset = "inset-3" }: { inset?: string }) {
  return (
    <div className={`pointer-events-none absolute ${inset}`} aria-hidden="true">
      {CORNERS.map((c) => (
        <svg
          key={c.pos}
          viewBox="0 0 24 24"
          className={`absolute size-6 ${c.pos}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={c.d} />
        </svg>
      ))}
    </div>
  );
}
