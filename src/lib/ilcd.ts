import type { DatasetType } from "@/lib/datasets"

/**
 * A practical subset of the ILCD (International Life Cycle Data) format used by
 * tiangong-lca-next, scoped to the fields a person actually authors. Sections that
 * are large, computed/workflow output in the real app (LCIA Results, the Validation
 * review record, mathematicalRelations) are intentionally not modeled here.
 */

export const LANGS = ["en", "zh"] as const
export type Lang = (typeof LANGS)[number]
export const LANG_LABELS: Record<Lang, string> = { en: "English", zh: "简体中文" }

export interface LangText {
  lang: Lang
  text: string
}

export function langText(en: string, zh = ""): LangText[] {
  const out: LangText[] = []
  if (en) out.push({ lang: "en", text: en })
  if (zh) out.push({ lang: "zh", text: zh })
  return out
}

export function getLangText(value: LangText[] | undefined, lang: Lang): string {
  return value?.find((v) => v.lang === lang)?.text ?? ""
}

export function setLangText(
  value: LangText[] | undefined,
  lang: Lang,
  text: string,
): LangText[] {
  const rest = (value ?? []).filter((v) => v.lang !== lang)
  return text ? [...rest, { lang, text }] : rest
}

/** ILCD's "GlobalReference": a pointer at another dataset, with a cached label. */
export interface DatasetRef {
  refObjectId: string | null
  type: DatasetType
  shortDescription: string
}

export function emptyRef(type: DatasetType): DatasetRef {
  return { refObjectId: null, type, shortDescription: "" }
}

export interface ComplianceDeclaration {
  referenceToComplianceSystem: string
  approvalOfOverallCompliance: string
}

export type ExchangeDirection = "Input" | "Output"

export interface ProcessExchange {
  dataSetInternalID: number
  referenceToFlowDataSet: DatasetRef
  exchangeDirection: ExchangeDirection
  meanAmount: number | null
  resultingAmount: number | null
  generalComment: LangText[]
}

export const DATASET_TYPES_OF_DATA_SET = [
  "LCI result",
  "Partly terminated system",
  "Average dataset",
  "Unit process, single operation",
  "Unit process, black box",
] as const

export const LICENSE_TYPES = [
  "Free of charge for all users and uses",
  "Free of charge for some user types or use types",
  "Free of charge for members only",
  "License fee",
  "Other",
] as const

export interface ProcessDataSet {
  processInformation: {
    dataSetInformation: {
      name: {
        baseName: LangText[]
        treatmentStandardsRoutes: LangText[]
        mixAndLocationTypes: LangText[]
      }
      classification: string[]
      generalComment: LangText[]
    }
    quantitativeReference: {
      referenceToReferenceFlow: number | null
    }
    time: {
      referenceYear: number | null
    }
    geography: {
      location: string
    }
  }
  modellingAndValidation: {
    typeOfDataSet: string
    dataCutOffAndCompletenessPrinciples: LangText[]
    referenceToDataSource: DatasetRef
    annualSupplyOrProductionVolume: LangText[]
    complianceDeclarations: ComplianceDeclaration[]
  }
  administrativeInformation: {
    referenceToCommissioner: DatasetRef
    intendedApplications: LangText[]
    referenceToPersonOrEntityGeneratingTheDataSet: DatasetRef
    dataSetVersion: string
    permanentDataSetURI: string
    referenceToOwnershipOfDataSet: DatasetRef
    copyright: boolean
    licenseType: string
    timeStamp: string
  }
  exchanges: ProcessExchange[]
}

export function emptyProcessDataSet(): ProcessDataSet {
  return {
    processInformation: {
      dataSetInformation: {
        name: { baseName: [], treatmentStandardsRoutes: [], mixAndLocationTypes: [] },
        classification: [],
        generalComment: [],
      },
      quantitativeReference: { referenceToReferenceFlow: null },
      time: { referenceYear: null },
      geography: { location: "" },
    },
    modellingAndValidation: {
      typeOfDataSet: "",
      dataCutOffAndCompletenessPrinciples: [],
      referenceToDataSource: emptyRef("source"),
      annualSupplyOrProductionVolume: [],
      complianceDeclarations: [],
    },
    administrativeInformation: {
      referenceToCommissioner: emptyRef("contact"),
      intendedApplications: [],
      referenceToPersonOrEntityGeneratingTheDataSet: emptyRef("contact"),
      dataSetVersion: "01.01.000",
      permanentDataSetURI: "",
      referenceToOwnershipOfDataSet: emptyRef("contact"),
      copyright: false,
      licenseType: "",
      timeStamp: new Date().toISOString(),
    },
    exchanges: [],
  }
}

/** Type guard + normalizer: fills in any missing branches so partial/legacy data doesn't crash the UI. */
export function toProcessDataSet(payload: unknown): ProcessDataSet {
  const empty = emptyProcessDataSet()
  const p = (payload ?? {}) as Partial<ProcessDataSet>
  return {
    processInformation: {
      dataSetInformation: {
        name: {
          baseName: p.processInformation?.dataSetInformation?.name?.baseName ?? [],
          treatmentStandardsRoutes:
            p.processInformation?.dataSetInformation?.name?.treatmentStandardsRoutes ?? [],
          mixAndLocationTypes:
            p.processInformation?.dataSetInformation?.name?.mixAndLocationTypes ?? [],
        },
        classification: p.processInformation?.dataSetInformation?.classification ?? [],
        generalComment: p.processInformation?.dataSetInformation?.generalComment ?? [],
      },
      quantitativeReference: {
        referenceToReferenceFlow:
          p.processInformation?.quantitativeReference?.referenceToReferenceFlow ?? null,
      },
      time: { referenceYear: p.processInformation?.time?.referenceYear ?? null },
      geography: { location: p.processInformation?.geography?.location ?? "" },
    },
    modellingAndValidation: {
      typeOfDataSet: p.modellingAndValidation?.typeOfDataSet ?? "",
      dataCutOffAndCompletenessPrinciples:
        p.modellingAndValidation?.dataCutOffAndCompletenessPrinciples ?? [],
      referenceToDataSource:
        p.modellingAndValidation?.referenceToDataSource ?? empty.modellingAndValidation.referenceToDataSource,
      annualSupplyOrProductionVolume:
        p.modellingAndValidation?.annualSupplyOrProductionVolume ?? [],
      complianceDeclarations: p.modellingAndValidation?.complianceDeclarations ?? [],
    },
    administrativeInformation: {
      referenceToCommissioner:
        p.administrativeInformation?.referenceToCommissioner ??
        empty.administrativeInformation.referenceToCommissioner,
      intendedApplications: p.administrativeInformation?.intendedApplications ?? [],
      referenceToPersonOrEntityGeneratingTheDataSet:
        p.administrativeInformation?.referenceToPersonOrEntityGeneratingTheDataSet ??
        empty.administrativeInformation.referenceToPersonOrEntityGeneratingTheDataSet,
      dataSetVersion: p.administrativeInformation?.dataSetVersion ?? "01.01.000",
      permanentDataSetURI: p.administrativeInformation?.permanentDataSetURI ?? "",
      referenceToOwnershipOfDataSet:
        p.administrativeInformation?.referenceToOwnershipOfDataSet ??
        empty.administrativeInformation.referenceToOwnershipOfDataSet,
      copyright: p.administrativeInformation?.copyright ?? false,
      licenseType: p.administrativeInformation?.licenseType ?? "",
      timeStamp: p.administrativeInformation?.timeStamp ?? new Date().toISOString(),
    },
    exchanges: normalizeExchanges(p.exchanges),
  }
}

/**
 * Coerces each exchange defensively so legacy/partial data (e.g. rows still on the
 * live database's pre-ILCD payload shape, before `seed.sql` is re-run) renders
 * gracefully instead of crashing on a missing nested reference.
 */
function normalizeExchanges(value: unknown): ProcessExchange[] {
  if (!Array.isArray(value)) return []
  return value.map((v, i) => {
    const e = (v ?? {}) as Partial<ProcessExchange>
    return {
      dataSetInternalID: e.dataSetInternalID ?? i + 1,
      referenceToFlowDataSet: e.referenceToFlowDataSet ?? emptyRef("flow"),
      exchangeDirection: e.exchangeDirection === "Output" ? "Output" : "Input",
      meanAmount: e.meanAmount ?? null,
      resultingAmount: e.resultingAmount ?? null,
      generalComment: e.generalComment ?? [],
    }
  })
}
