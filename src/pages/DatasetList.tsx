import { useEffect, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type Dataset,
  type DatasetType,
  getDatasetTypeInfo,
  listDatasets,
} from "@/lib/datasets"

export function DatasetList() {
  const { type } = useParams<{ type: string }>()
  const typeInfo = type ? getDatasetTypeInfo(type) : undefined
  const [datasets, setDatasets] = useState<Dataset[]>([])

  useEffect(() => {
    if (!typeInfo) return
    listDatasets(typeInfo.type as DatasetType).then(setDatasets)
  }, [typeInfo])

  if (!typeInfo) {
    return <Navigate to="/open-data/process" replace />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{typeInfo.label}</CardTitle>
        <Button asChild size="sm">
          <Link to={`/open-data/${typeInfo.type}/new`}>
            <Plus className="size-4" />
            Add
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Link
                    to={`/open-data/${typeInfo.type}/${d.id}`}
                    className="text-primary hover:underline"
                  >
                    {d.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {d.description}
                </TableCell>
              </TableRow>
            ))}
            {datasets.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  No {typeInfo.label.toLowerCase()} yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
