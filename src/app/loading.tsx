export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-brand border-t-primary-brand" />
        <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted-brand">
          Chargement…
        </p>
      </div>
    </div>
  )
}
