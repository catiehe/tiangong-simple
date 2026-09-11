import { useEffect, useState, type FormEvent } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createDataset,
  getDataset,
  getDatasetTypeInfo,
  updateDataset,
  type Dataset,
  type DatasetType,
} from "@/lib/datasets"
import { supabase } from "@/lib/supabase"
import { useSessionStore } from "@/state/session"
import { ProcessForm } from "@/pages/ProcessForm"
import { FlowForm } from "@/pages/FlowForm"
import { FlowPropertyForm } from "@/pages/FlowPropertyForm"
import { UnitGroupForm } from "@/pages/UnitGroupForm"
import { SourceForm } from "@/pages/SourceForm"
import { ContactForm } from "@/pages/ContactForm"

interface PayloadRow {
  key: string
  value: string
}

function parsePayloadValue(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function payloadToRows(payload: Record<string, unknown>): PayloadRow[] {
  const entries = Object.entries(payload)
  if (entries.length === 0) return [{ key: "", value: "" }]
  return entries.map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }))
}

export function DatasetForm() {
  const { type, id } = useParams<{ type: string; id?: string }>()
  const typeInfo = type ? getDatasetTypeInfo(type) : undefined
  const session = useSessionStore((s) => s.session)
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [rows, setRows] = useState<PayloadRow[]>([{ key: "", value: "" }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existing, setExisting] = useState<Dataset | null | undefined>(
    id ? undefined : null,
  )

  useEffect(() => {
    if (!id) return
    getDataset(id).then((d) => {
      setExisting(d ?? null)
      if (d) {
        setName(d.name)
        setDescription(d.description ?? "")
        setRows(payloadToRows(d.payload))
      }
    })
  }, [id])

  if (!typeInfo) return <Navigate to="/open-data/process" replace />
  if (typeInfo.type === "process") return <ProcessForm />
  if (typeInfo.type === "flow") return <FlowForm />
  if (typeInfo.type === "flow_property") return <FlowPropertyForm />
  if (typeInfo.type === "unit_group") return <UnitGroupForm />
  if (typeInfo.type === "source") return <SourceForm />
  if (typeInfo.type === "contact") return <ContactForm />
  if (!session) return <Navigate to="/sign-in" replace />
  if (id && existing === undefined) return null
  if (id && existing === null) {
    return <p className="text-muted-foreground">Not found.</p>
  }

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
      if (row.key.trim()) payload[row.key.trim()] = parsePayloadValue(row.value)
    }

    try {
      const input = {
        type: typeInfo!.type as DatasetType,
        name,
        description: description || null,
        payload,
      }
      const dataset = id
        ? await updateDataset(id, input)
        : await createDataset(input)
      navigate(`/open-data/${typeInfo!.type}/${dataset.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.")
      setSubmitting(false)
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>
          {id ? "Edit" : "Add"} {typeInfo.singular}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!supabase ? (
          <p className="text-muted-foreground text-sm">
            Supabase isn't configured for this deployment (missing{" "}
            <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>
            ), so {id ? "editing" : "adding"} datasets is unavailable.
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
                <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    placeholder="key"
                    value={row.key}
                    onChange={(e) => updateRow(i, "key", e.target.value)}
                    className="sm:w-1/3"
                  />
                  <div className="flex items-center gap-2">
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
              {submitting ? "Saving..." : id ? "Save changes" : "Save"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
