export default async function QuotePage({
  params,
}: {
  params: Promise<{ quoteId: string }>
}) {
  const { quoteId } = await params

  return (
    <div className="p-6">
      <h1 className="text-sm font-medium">Quote</h1>
      <p className="text-muted-foreground text-xs">{quoteId}</p>
    </div>
  )
}
