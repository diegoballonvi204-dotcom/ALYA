export default function AdminLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="h-3 w-28 bg-slate-200 rounded-md" />
        <div className="h-8 w-72 bg-slate-300 rounded-lg" />
        <div className="h-3 w-96 bg-slate-100 rounded-md" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-200 rounded-md" />
              <div className="h-7 w-7 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-8 w-14 bg-slate-300 rounded-lg" />
            <div className="h-2.5 w-28 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="h-6 w-44 bg-slate-200 rounded-md" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4 justify-between"
            >
              <div className="h-4 w-40 bg-slate-200 rounded-md" />
              <div className="h-4 w-28 bg-slate-100 rounded-md" />
              <div className="h-6 w-20 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
