import React from "react";

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-warmgrey/70 overflow-hidden shadow-soft animate-pulse flex flex-col h-full">
      {/* Image Skeleton */}
      <div className="relative aspect-[4/3] bg-warmgrey/30 w-full" />

      {/* Content Skeleton */}
      <div className="p-5 sm:p-6 space-y-3 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-warmgrey/30 rounded w-1/3" />
          <div className="h-5 bg-warmgrey/40 rounded w-3/4" />
          <div className="h-3 bg-warmgrey/20 rounded w-full" />
        </div>

        <div className="pt-4 border-t border-warmgrey/40 flex items-center justify-between">
          <div className="h-6 bg-warmgrey/40 rounded w-20" />
          <div className="h-9 bg-warmgrey/30 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="py-12 animate-pulse space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left media placeholder */}
        <div className="lg:col-span-7 aspect-[4/3] bg-warmgrey/30 rounded-3xl" />

        {/* Right details placeholder */}
        <div className="lg:col-span-5 space-y-6">
          <div className="h-4 bg-warmgrey/30 rounded w-1/4" />
          <div className="h-8 bg-warmgrey/40 rounded w-3/4" />
          <div className="h-6 bg-warmgrey/40 rounded w-1/3" />
          <div className="h-20 bg-warmgrey/20 rounded w-full" />
          <div className="h-12 bg-warmgrey/40 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  );
}
