import { Skeleton, SkeletonStats, SkeletonRDVCard } from "@/components/ui/skeletons"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-3 w-36" />
      </div>
      <SkeletonStats count={4} />
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <SkeletonRDVCard />
        <SkeletonRDVCard />
      </div>
    </div>
  )
}
