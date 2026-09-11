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
import { toFlowDataSet } from "@/lib/ilcd"
import { LangRow } from "@/components/ilcd/lang-row"

export function FlowDetail() {
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

  const ds = toFlowDataSet(dataset.payload)
  const info = ds.flowInformation
  const model = ds.modellingAndValidation
  const admin = ds.administrativeInformation

  return (
    <div className="flex flex-col gap-4">
      <Link to="/open-data/flow" className="text-sm text-muted-foreground hover:underline">
        ← Back to Flows
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{dataset.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="flex-wrap">
              <TabsTrigger value="info">Flow information</TabsTrigger>
              <TabsTrigger value="model">Modelling and validation</TabsTrigger>
              <TabsTrigger value="admin">Administrative information</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex flex-col gap-4 pt-4">
              <p className="text-muted-foreground text-xs">ID: {dataset.id}</p>
              <LangRow label="Base name" value={info.dataSetInformation.name.baseName} />
              <LangRow
                label="Treatment, standards, routes"
                value={info.dataSetInformation.name.treatmentStandardsRoutes}
              />
              <LangRow
                label="Mix and location types"
                value={info.dataSetInformation.name.mixAndLocationTypes}
              />
              {info.dataSetInformation.classification.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Classification</p>
                  <p className="text-muted-foreground text-sm">
                    {info.dataSetInformation.classification.join(" / ")}
                  </p>
                </div>
              )}
              <div className="flex gap-8">
                {info.dataSetInformation.casNumber && (
                  <div>
                    <p className="text-sm font-medium">CAS number</p>
                    <p className="text-muted-foreground text-sm">{info.dataSetInformation.casNumber}</p>
                  </div>
                )}
                {info.dataSetInformation.sumFormula && (
                  <div>
                    <p className="text-sm font-medium">Sum formula</p>
                    <p className="text-muted-foreground text-sm">{info.dataSetInformation.sumFormula}</p>
                  </div>
                )}
              </div>
              <LangRow label="General comment" value={info.dataSetInformation.generalComment} />
            </TabsContent>

            <TabsContent value="model" className="flex flex-col gap-4 pt-4">
              {model.typeOfDataSet && (
                <div>
                  <p className="text-sm font-medium">Type of dataset</p>
                  <p className="text-muted-foreground text-sm">{model.typeOfDataSet}</p>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Flow property</TableHead>
                    <TableHead>Conversion factor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ds.flowProperties.map((p) => (
                    <TableRow key={p.dataSetInternalID}>
                      <TableCell>
                        {info.quantitativeReference.referenceToReferenceFlowProperty ===
                          p.dataSetInternalID && <Star className="fill-primary text-primary size-4" />}
                      </TableCell>
                      <TableCell>{p.referenceToFlowPropertyDataSet.shortDescription}</TableCell>
                      <TableCell>{p.meanValue ?? ""}</TableCell>
                    </TableRow>
                  ))}
                  {ds.flowProperties.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        No flow properties yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {model.complianceDeclarations.length > 0 && (
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
