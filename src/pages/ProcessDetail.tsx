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
import { LANGS, LANG_LABELS, getLangText, toProcessDataSet, type LangText } from "@/lib/ilcd"

function LangRow({ label, value }: { label: string; value: LangText[] }) {
  if (value.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium">{label}</p>
      {LANGS.map((lang) => {
        const text = getLangText(value, lang)
        if (!text) return null
        return (
          <p key={lang} className="text-muted-foreground text-sm">
            <span className="mr-2 text-xs">{LANG_LABELS[lang]}</span>
            {text}
          </p>
        )
      })}
    </div>
  )
}

export function ProcessDetail() {
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

  const ds = toProcessDataSet(dataset.payload)
  const info = ds.processInformation
  const model = ds.modellingAndValidation
  const admin = ds.administrativeInformation

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/open-data/process"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to Processes
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{dataset.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="flex-wrap">
              <TabsTrigger value="info">Process information</TabsTrigger>
              <TabsTrigger value="model">Modelling and validation</TabsTrigger>
              <TabsTrigger value="admin">Administrative information</TabsTrigger>
              <TabsTrigger value="io">Inputs and Outputs</TabsTrigger>
              <TabsTrigger value="compliance">Compliance declarations</TabsTrigger>
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
              <LangRow
                label="General comment on data set"
                value={info.dataSetInformation.generalComment}
              />
              <div className="flex gap-8">
                {info.time.referenceYear != null && (
                  <div>
                    <p className="text-sm font-medium">Reference year</p>
                    <p className="text-muted-foreground text-sm">{info.time.referenceYear}</p>
                  </div>
                )}
                {info.geography.location && (
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-muted-foreground text-sm">{info.geography.location}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="model" className="flex flex-col gap-4 pt-4">
              {model.typeOfDataSet && (
                <div>
                  <p className="text-sm font-medium">Type of dataset</p>
                  <p className="text-muted-foreground text-sm">{model.typeOfDataSet}</p>
                </div>
              )}
              <LangRow
                label="Data cut-off and completeness principles"
                value={model.dataCutOffAndCompletenessPrinciples}
              />
              {model.referenceToDataSource.shortDescription && (
                <div>
                  <p className="text-sm font-medium">Reference to data source</p>
                  <p className="text-muted-foreground text-sm">
                    {model.referenceToDataSource.shortDescription}
                  </p>
                </div>
              )}
              <LangRow
                label="Annual supply or production volume"
                value={model.annualSupplyOrProductionVolume}
              />
            </TabsContent>

            <TabsContent value="admin" className="flex flex-col gap-4 pt-4">
              {admin.referenceToCommissioner.shortDescription && (
                <div>
                  <p className="text-sm font-medium">Reference to commissioner</p>
                  <p className="text-muted-foreground text-sm">
                    {admin.referenceToCommissioner.shortDescription}
                  </p>
                </div>
              )}
              <LangRow label="Intended applications" value={admin.intendedApplications} />
              {admin.referenceToPersonOrEntityGeneratingTheDataSet.shortDescription && (
                <div>
                  <p className="text-sm font-medium">Data generator</p>
                  <p className="text-muted-foreground text-sm">
                    {admin.referenceToPersonOrEntityGeneratingTheDataSet.shortDescription}
                  </p>
                </div>
              )}
              <div className="flex gap-8">
                <div>
                  <p className="text-sm font-medium">Data set version</p>
                  <p className="text-muted-foreground text-sm">{admin.dataSetVersion}</p>
                </div>
                {admin.licenseType && (
                  <div>
                    <p className="text-sm font-medium">License type</p>
                    <p className="text-muted-foreground text-sm">{admin.licenseType}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Copyright</p>
                  <p className="text-muted-foreground text-sm">
                    {admin.copyright ? "Yes" : "No"}
                  </p>
                </div>
              </div>
              {admin.referenceToOwnershipOfDataSet.shortDescription && (
                <div>
                  <p className="text-sm font-medium">Reference to ownership of data set</p>
                  <p className="text-muted-foreground text-sm">
                    {admin.referenceToOwnershipOfDataSet.shortDescription}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="io" className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Direction</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ds.exchanges.map((ex) => (
                    <TableRow key={ex.dataSetInternalID}>
                      <TableCell>
                        {info.quantitativeReference.referenceToReferenceFlow ===
                          ex.dataSetInternalID && (
                          <Star className="fill-primary text-primary size-4" />
                        )}
                      </TableCell>
                      <TableCell>{ex.exchangeDirection}</TableCell>
                      <TableCell>{ex.referenceToFlowDataSet.shortDescription}</TableCell>
                      <TableCell>{ex.meanAmount ?? ""}</TableCell>
                    </TableRow>
                  ))}
                  {ds.exchanges.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No exchanges yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="compliance" className="pt-4">
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
