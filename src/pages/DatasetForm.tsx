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

interface PayloadRow {
  key: string
  value: string
}

interface ExchangeRow {
  direction: string
  flow: string
  amount: string
  unit: string
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

function toExchangeRows(value: unknown): ExchangeRow[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => {
    const e = (v ?? {}) as Record<string, unknown>
    return {
      direction: e.direction != null ? String(e.direction) : "",
      flow: e.flow != null ? String(e.flow) : "",
      amount: e.amount != null ? String(e.amount) : "",
      unit: e.unit != null ? String(e.unit) : "",
    }
  })
}

export function DatasetForm() {
  const { type, id } = useParams<{ type: string; id?: string }>()
  const typeInfo = type ? getDatasetTypeInfo(type) : undefined
  const isProcess = typeInfo?.type === "process"
  const session = useSessionStore((s) => s.session)
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [unit, setUnit] = useState("")
  const [referenceAmount, setReferenceAmount] = useState("")
  const [exchanges, setExchanges] = useState<ExchangeRow[]>([])
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
        if (d.type === "process") {
          const { unit: u, reference_amount, exchanges: ex, ...rest } =
            d.payload as Record<string, unknown>
          setUnit(typeof u === "string" ? u : u != null ? String(u) : "")
          setReferenceAmount(reference_amount != null ? String(reference_amount) : "")
          setExchanges(toExchangeRows(ex))
          setRows(payloadToRows(rest))
        } else {
          setRows(payloadToRows(d.payload))
        }
      }
    })
  }, [id])

  if (!typeInfo) return <Navigate to="/open-data/process" replace />
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

  function updateExchange(index: number, field: keyof ExchangeRow, value: string) {
    setExchanges((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    )
  }

  function addExchange() {
    setExchanges((prev) => [
      ...prev,
      { direction: "", flow: "", amount: "", unit: "" },
    ])
  }

  function removeExchange(index: number) {
    setExchanges((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: Record<string, unknown> = {}
    for (const row of rows) {
      if (row.key.trim()) payload[row.key.trim()] = parsePayloadValue(row.value)
    }
    if (isProcess) {
      if (unit.trim()) payload.unit = unit.trim()
      if (referenceAmount.trim()) {
        payload.reference_amount = parsePayloadValue(referenceAmount.trim())
      }
      const cleanExchanges = exchanges
        .filter((ex) => ex.direction.trim() || ex.flow.trim())
        .map((ex) => ({
          direction: ex.direction.trim(),
          flow: ex.flow.trim(),
          amount: parsePayloadValue(ex.amount.trim()),
          unit: ex.unit.trim(),
        }))
      if (cleanExchanges.length > 0) payload.exchanges = cleanExchanges
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

            {isProcess && (
              <>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="unit">Reference unit</Label>
                    <Input
                      id="unit"
                      placeholder="kg, kWh, tkm..."
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="reference_amount">Reference amount</Label>
                    <Input
                      id="reference_amount"
                      placeholder="1"
                      value={referenceAmount}
                      onChange={(e) => setReferenceAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Exchanges</Label>
                  {exchanges.map((ex, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:border-none sm:p-0"
                    >
                      <Input
                        placeholder="input/output"
                        value={ex.direction}
                        onChange={(e) => updateExchange(i, "direction", e.target.value)}
                        className="sm:w-28"
                      />
                      <Input
                        placeholder="flow"
                        value={ex.flow}
                        onChange={(e) => updateExchange(i, "flow", e.target.value)}
                        className="sm:flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="amount"
                          value={ex.amount}
                          onChange={(e) => updateExchange(i, "amount", e.target.value)}
                          className="sm:w-20"
                        />
                        <Input
                          placeholder="unit"
                          value={ex.unit}
                          onChange={(e) => updateExchange(i, "unit", e.target.value)}
                          className="sm:w-20"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeExchange(i)}
                          aria-label="Remove exchange"
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
                    onClick={addExchange}
                    className="self-start"
                  >
                    <Plus className="size-4" />
                    Add exchange
                  </Button>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <Label>{isProcess ? "Other fields" : "Fields"}</Label>
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
