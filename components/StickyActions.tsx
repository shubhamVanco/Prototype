/**
 * The screen's main actions, pinned to the bottom of the scroll area (just above the nav),
 * so they can be tapped without scrolling on any phone size.
 */
export function StickyActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-6 border-t border-line bg-bg/95 px-5 py-3 backdrop-blur-md">
      {children}
    </div>
  );
}
