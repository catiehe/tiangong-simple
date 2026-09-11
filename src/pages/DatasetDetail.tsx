import { useParams } from "react-router-dom"
import { getDatasetTypeInfo } from "@/lib/datasets"
import { ModelDetail } from "@/pages/ModelDetail"
import { ProcessDetail } from "@/pages/ProcessDetail"
import { FlowDetail } from "@/pages/FlowDetail"
import { FlowPropertyDetail } from "@/pages/FlowPropertyDetail"
import { UnitGroupDetail } from "@/pages/UnitGroupDetail"
import { SourceDetail } from "@/pages/SourceDetail"
import { ContactDetail } from "@/pages/ContactDetail"

export function DatasetDetail() {
  const { type } = useParams<{ type: string }>()
  const typeInfo = type ? getDatasetTypeInfo(type) : undefined

  if (!typeInfo) return null
  switch (typeInfo.type) {
    case "model":
      return <ModelDetail />
    case "process":
      return <ProcessDetail />
    case "flow":
      return <FlowDetail />
    case "flow_property":
      return <FlowPropertyDetail />
    case "unit_group":
      return <UnitGroupDetail />
    case "source":
      return <SourceDetail />
    case "contact":
      return <ContactDetail />
  }
}
