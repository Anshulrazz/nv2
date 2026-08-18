import React from "react";

// Base skeleton block — uses design tokens instead of hardcoded zinc-900
export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-shimmer animate-pulse rounded-lg ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-muted/40 border border-border rounded-2xl p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
          <div className="pt-2 flex items-center justify-between border-t border-border/40">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-muted/40 border border-border rounded-xl p-4 flex items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 min-w-0 flex-1">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function FeedPostSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-muted/30 border border-border p-5 sm:p-6 rounded-2xl space-y-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="flex items-center gap-6 pt-2 border-t border-border/40">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 border-b border-border pb-6 animate-pulse">
      <Skeleton className="h-4 w-28 rounded-md" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-60 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
    </div>
  );
}

// Dashboard overview skeleton — matches the final layout to prevent CLS
export function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-background text-foreground overflow-hidden p-4 sm:p-8 lg:p-10 space-y-8">
      {/* Header banner skeleton */}
      <div className="border border-border/50 bg-muted/30 rounded-[2rem] p-6 sm:p-10 animate-pulse">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-3 w-48 rounded-full" />
            <Skeleton className="h-9 w-64 rounded-xl" />
            <Skeleton className="h-4 w-80 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-36 rounded-xl" />
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[2rem] bg-muted/30 border border-border/50 p-5 flex items-center justify-between gap-3 animate-pulse"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-16 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <Skeleton className="size-11 rounded-2xl shrink-0" />
          </div>
        ))}
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-36 w-full rounded-[2.5rem]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-52 w-full rounded-[2rem]" />
            <Skeleton className="h-52 w-full rounded-[2rem]" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// Register page skeleton — layout-preserving to reduce CLS
export function RegisterFormSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 max-w-lg mx-auto animate-pulse">
      {/* Back link */}
      <Skeleton className="h-4 w-24 rounded mb-6" />

      {/* Title */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-8 w-3/4 rounded-xl" />
        <Skeleton className="h-4 w-56 rounded" />
      </div>

      {/* Form sections */}
      <div className="space-y-6">
        <div className="border border-border/50 bg-muted/30 rounded-2xl p-5 space-y-4">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <Skeleton className="h-14 w-full rounded-xl p-4" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
