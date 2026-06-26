'use client';

export function EventCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-card animate-pulse">
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20" />
      <div className="absolute top-3 left-3 h-5 w-20 rounded-full bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-6 w-3/4 rounded bg-white/5" />
        <div className="h-4 w-1/2 rounded bg-white/5" />
        <div className="h-4 w-1/3 rounded bg-white/5" />
        <div className="h-10 w-full rounded-lg bg-white/5" />
      </div>
    </div>
  );
}

export function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-white/5 rounded animate-pulse"
        />
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-card border border-white/10 animate-pulse"
        >
          <div className="h-10 w-10 rounded-xl bg-white/5" />
          <div className="mt-4 h-4 w-20 rounded bg-white/5" />
          <div className="mt-2 h-8 w-24 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-white/10 animate-pulse">
      <div className="w-20 h-20 rounded-lg bg-white/5" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded bg-white/5" />
        <div className="h-4 w-16 rounded bg-white/5" />
      </div>
    </div>
  );
}
