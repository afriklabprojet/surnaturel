import { Skeleton, SkeletonRDVCard } from "@/components/ui/skeletons"

export default function MesRDVLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="space-y-4">
        <SkeletonRDVCard />
        <SkeletonRDVCard />
        <SkeletonRDVCard />
      </div>
    </div>
  )
}
