import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDataset, getDatasetTypeInfo, type Dataset } from "@/lib/datasets"
import { ProcessDetail } from "@/pages/ProcessDetail"
import { FlowDetail } from "@/pages/FlowDetail"
import { FlowPropertyDetail } from "@/pages/FlowPropertyDetail"
import { UnitGroupDetail } from "@/pages/UnitGroupDetail"
import { SourceDetail } from "@/pages/SourceDetail"
import { ContactDetail } from "@/pages/ContactDetail"

export function DatasetDetail() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const typeInfo = type ? getDatasetTypeInfo(type) : undefined
  const [dataset, setDataset] = useState<Dataset | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getDataset(id).then((d) => setDataset(d ?? null))
  }, [id])

  if (!typeInfo) return null
  if (typeInfo.type === "process") return <ProcessDetail />
  if (typeInfo.type === "flow") return <FlowDetail />
  if (typeInfo.type === "flow_property") return <FlowPropertyDetail />
  if (typeInfo.type === "unit_group") return <UnitGroupDetail />
  if (typeInfo.type === "source") return <SourceDetail />
  if (typeInfo.type === "contact") return <ContactDetail />
  if (dataset === undefined) return null
  if (dataset === null) {
    return <p className="text-muted-foreground">Not found.</p>
  }

  const rest = dataset.payload as Record<string, unknown>

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

          {Object.keys(rest).length > 0 && (
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
