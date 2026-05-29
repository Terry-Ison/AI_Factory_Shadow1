type Props = {
  children: React.ReactNode
}

/**
 * Full-viewport auth shell: background image, dark overlay,
 * left-aligned tall card (1/3 width) with brand headline on the right.
 */
export function AuthLayout({ children }: Props) {
  return (
    <div
      className="relative flex min-h-screen w-full overflow-hidden"
      style={{
        backgroundImage: `url('/hAI-ison.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Left card panel — 1/3 width, full height, min 3/4 vh */}
      <div className="relative z-10 flex min-h-screen w-full flex-col sm:w-1/3 sm:min-w-[360px]">
        <div className="flex min-h-[75vh] flex-1 flex-col justify-center px-6 py-10 sm:px-8">
          {/* Brand mark */}
          <div className="mb-8">
            <span className="font-display text-3xl font-bold tracking-tight text-white">
              Transly
            </span>
          </div>

          {/* Card content injected here */}
          <div className="rounded-2xl border border-white/10 bg-black/50 p-7 shadow-2xl backdrop-blur-md">
            {children}
          </div>
        </div>
      </div>

      {/* Right branding — hidden on mobile */}
      <div className="relative z-10 hidden flex-1 flex-col items-center justify-center px-10 sm:flex">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-5xl font-bold leading-tight text-white drop-shadow-lg xl:text-6xl">
            Welcome to<br />
            <span className="text-indigo-400">Transly</span>
          </h1>
          <p className="mt-5 text-lg text-slate-300 drop-shadow">
            Real-time voice translation — effortless conversations across any language barrier.
          </p>
        </div>
      </div>
    </div>
  )
}
