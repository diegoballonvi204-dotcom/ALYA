export default function LawyerLoading() {
  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="h-3 w-32 bg-slate-200 rounded-md" />
        <div className="h-8 w-64 bg-slate-300 rounded-lg" />
        <div className="h-3 w-80 bg-slate-100 rounded-md" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 rounded-md" />
              <div className="h-8 w-8 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-7 w-16 bg-slate-300 rounded-lg" />
            <div className="h-2.5 w-32 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 h-64"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
