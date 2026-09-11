import { Navigate, useParams } from "react-router-dom"
import { getDatasetTypeInfo } from "@/lib/datasets"
import { ModelForm } from "@/pages/ModelForm"
import { ProcessForm } from "@/pages/ProcessForm"
import { FlowForm } from "@/pages/FlowForm"
import { FlowPropertyForm } from "@/pages/FlowPropertyForm"
import { UnitGroupForm } from "@/pages/UnitGroupForm"
import { SourceForm } from "@/pages/SourceForm"
import { ContactForm } from "@/pages/ContactForm"

export function DatasetForm() {
  const { type } = useParams<{ type: string }>()
  const typeInfo = type ? getDatasetTypeInfo(type) : undefined

  if (!typeInfo) return <Navigate to="/open-data/process" replace />
  switch (typeInfo.type) {
    case "model":
      return <ModelForm />
    case "process":
      return <ProcessForm />
    case "flow":
      return <FlowForm />
    case "flow_property":
      return <FlowPropertyForm />
    case "unit_group":
      return <UnitGroupForm />
    case "source":
      return <SourceForm />
    case "contact":
      return <ContactForm />
  }
}
