/** Props every built-in editor factory receives from the workbench editor host. */
export type BuiltinEditorProps = {
  resourceId: string
  title: string
}

/** Minimal stub quote editor (076). Real quote form arrives in 077. */
export function QuoteEditorStub({ resourceId, title }: BuiltinEditorProps) {
  return (
    <div
      data-testid="quoting-document-stub-editor"
      className="flex flex-1 flex-col gap-1 p-4 text-sm"
    >
      <h2 className="font-medium">{title}</h2>
      <p className="text-xs text-muted-foreground">
        Stub quote editor from <code>quoting.document</code> · resource{" "}
        <code>{resourceId}</code>. The real quote form moves here in 077.
      </p>
    </div>
  )
}
