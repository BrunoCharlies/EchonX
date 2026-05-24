/** Explore uses full desktop width (breaks out of the standard max-w-6xl shell). */
export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 w-[100vw] max-w-[100vw] -translate-x-1/2">
      <div className="mx-auto w-full max-w-[1520px] px-3 py-3 sm:px-5 lg:px-6">{children}</div>
    </div>
  );
}
