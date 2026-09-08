import { useState, type FormEvent } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createDataset,
  getDatasetTypeInfo,
  type DatasetType,
} from "@/lib/datasets"
import { supabase } from "@/lib/supabase"
import { useSessionStore } from "@/state/session"

interface PayloadRow {
  key: string
  value: string
}

export function DatasetForm() {
  const { type } = useParams<{ type: string }>()
  const typeInfo = type ? getDatasetTypeInfo(type) : undefined
  const session = useSessionStore((s) => s.session)
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [rows, setRows] = useState<PayloadRow[]>([{ key: "", value: "" }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!typeInfo) return <Navigate to="/open-data/process" replace />
  if (!session) return <Navigate to="/sign-in" replace />

  function updateRow(index: number, field: keyof PayloadRow, value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    )
  }

  function addRow() {
    setRows((prev) => [...prev, { key: "", value: "" }])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: Record<string, unknown> = {}
    for (const row of rows) {
      if (row.key.trim()) payload[row.key.trim()] = row.value
    }

    try {
      const dataset = await createDataset({
        type: typeInfo!.type as DatasetType,
        name,
        description: description || null,
        payload,
      })
      navigate(`/open-data/${typeInfo!.type}/${dataset.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.")
      setSubmitting(false)
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Add {typeInfo.label.replace(/s$/, "")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!supabase ? (
          <p className="text-muted-foreground text-sm">
            Supabase isn't configured for this deployment (missing{" "}
            <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>
            ), so adding datasets is unavailable.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Fields</Label>
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="key"
                    value={row.key}
                    onChange={(e) => updateRow(i, "key", e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    placeholder="value"
                    value={row.value}
                    onChange={(e) => updateRow(i, "value", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(i)}
                    aria-label="Remove field"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="self-start"
              >
                <Plus className="size-4" />
                Add field
              </Button>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
