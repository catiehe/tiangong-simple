import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDataset, getDatasetTypeInfo, type Dataset } from "@/lib/datasets"

interface Exchange {
  direction: string
  flow: string
  amount: number
  unit: string
}

function isExchangeArray(value: unknown): value is Exchange[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        v &&
        typeof v === "object" &&
        "direction" in v &&
        "flow" in v &&
        "amount" in v,
    )
  )
}

export function DatasetDetail() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const typeInfo = type ? getDatasetTypeInfo(type) : undefined
  const [dataset, setDataset] = useState<Dataset | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getDataset(id).then((d) => setDataset(d ?? null))
  }, [id])

  if (!typeInfo) return null
  if (dataset === undefined) return null
  if (dataset === null) {
    return <p className="text-muted-foreground">Not found.</p>
  }

  const { unit, reference_amount, exchanges, ...rest } = dataset.payload as Record<
    string,
    unknown
  >

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/open-data/${typeInfo.type}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to {typeInfo.label}
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{dataset.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {dataset.description && <p>{dataset.description}</p>}

          {typeInfo.type === "process" && isExchangeArray(exchanges) && (
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Reference: {String(reference_amount)} {String(unit)}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exchanges.map((ex, i) => (
                    <TableRow key={i}>
                      <TableCell className="capitalize">{ex.direction}</TableCell>
                      <TableCell>{ex.flow}</TableCell>
                      <TableCell>{ex.amount}</TableCell>
                      <TableCell>{ex.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {typeInfo.type !== "process" && Object.keys(rest).length > 0 && (
            <Table>
              <TableBody>
                {Object.entries(rest).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium capitalize">
                      {key.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
