import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Star } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDataset, type Dataset } from "@/lib/datasets"
import { toUnitGroupDataSet } from "@/lib/ilcd"
import { LangRow } from "@/components/ilcd/lang-row"

export function UnitGroupDetail() {
  const { id } = useParams<{ id: string }>()
  const [dataset, setDataset] = useState<Dataset | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getDataset(id).then((d) => setDataset(d ?? null))
  }, [id])

  if (dataset === undefined) return null
  if (dataset === null) {
    return <p className="text-muted-foreground">Not found.</p>
  }

  const ds = toUnitGroupDataSet(dataset.payload)
  const info = ds.unitGroupInformation
  const model = ds.modellingAndValidation
  const admin = ds.administrativeInformation

  return (
    <div className="flex flex-col gap-4">
      <Link to="/open-data/unit_group" className="text-sm text-muted-foreground hover:underline">
        ← Back to Unit Groups
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{dataset.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="flex-wrap">
              <TabsTrigger value="info">Unit group information</TabsTrigger>
              <TabsTrigger value="model">Modelling and validation</TabsTrigger>
              <TabsTrigger value="admin">Administrative information</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex flex-col gap-4 pt-4">
              <p className="text-muted-foreground text-xs">ID: {dataset.id}</p>
              <LangRow label="Name" value={info.dataSetInformation.name} />
              {info.dataSetInformation.classification.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Classification</p>
                  <p className="text-muted-foreground text-sm">
                    {info.dataSetInformation.classification.join(" / ")}
                  </p>
                </div>
              )}
              <LangRow label="General comment" value={info.dataSetInformation.generalComment} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Unit</TableHead>
                    <TableHead>Conversion factor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ds.units.map((u) => (
                    <TableRow key={u.dataSetInternalID}>
                      <TableCell>
                        {info.quantitativeReference.referenceToReferenceUnit === u.dataSetInternalID && (
                          <Star className="fill-primary text-primary size-4" />
                        )}
                      </TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.meanValue ?? ""}</TableCell>
                    </TableRow>
                  ))}
                  {ds.units.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        No units yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="model" className="pt-4">
              {model.complianceDeclarations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No compliance declarations.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Compliance system</TableHead>
                      <TableHead>Approval</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {model.complianceDeclarations.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{c.referenceToComplianceSystem}</TableCell>
                        <TableCell>{c.approvalOfOverallCompliance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="admin" className="flex flex-col gap-4 pt-4">
              <div>
                <p className="text-sm font-medium">Data set version</p>
                <p className="text-muted-foreground text-sm">{admin.dataSetVersion}</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
