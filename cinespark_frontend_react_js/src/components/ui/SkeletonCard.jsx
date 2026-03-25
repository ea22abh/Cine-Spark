export default function SkeletonCard() {
  return (
    <div className="bg-cinema-800 rounded-xl overflow-hidden">
      <div className="skeleton aspect-[2/3] w-full"></div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4 rounded"></div>
        <div className="skeleton h-3 w-1/2 rounded"></div>
        <div className="flex gap-2 mt-4">
          <div className="skeleton h-8 w-20 rounded-full"></div>
          <div className="skeleton h-8 w-20 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
