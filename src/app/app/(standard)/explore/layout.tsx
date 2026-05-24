/** Explore uses full desktop width (breaks out of the standard max-w-6xl shell). */
export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 w-[100vw] max-w-[100vw] -translate-x-1/2 max-xl:touch-pan-y">
      <div className="mx-auto w-full max-w-[1520px] px-3 py-3 pb-24 max-xl:overscroll-y-auto sm:px-5 sm:pb-28 lg:px-6 lg:pb-8">
        {children}
      </div>
    </div>
  );
}
