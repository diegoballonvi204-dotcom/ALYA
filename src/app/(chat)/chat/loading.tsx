export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4.5rem)] w-full overflow-hidden bg-slate-50 animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-80 sm:w-96 border-r border-slate-200 bg-white p-4 space-y-4 shrink-0 hidden md:block">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="h-4 w-28 bg-slate-200 rounded-md" />
          <div className="h-4 w-12 bg-slate-100 rounded-full" />
        </div>
        <div className="h-9 w-full bg-slate-100 rounded-xl" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-slate-300 rounded-md" />
                <div className="h-2.5 w-44 bg-slate-200 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area Skeleton */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <div className="h-16 bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-slate-300 rounded-md" />
              <div className="h-2.5 w-24 bg-slate-200 rounded-md" />
            </div>
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded-xl" />
        </div>

        <div className="space-y-4 max-w-xl mx-auto w-full py-8">
          <div className="h-14 bg-white border border-slate-200 rounded-2xl p-3 w-3/4 shadow-xs" />
          <div className="h-14 bg-slate-900 rounded-2xl p-3 w-3/4 ml-auto" />
          <div className="h-14 bg-white border border-slate-200 rounded-2xl p-3 w-2/3 shadow-xs" />
        </div>

        <div className="h-14 bg-white border border-slate-200 rounded-2xl p-3 flex items-center shadow-xs" />
      </div>
    </div>
  );
}
