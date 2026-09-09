import mockDatasets from "@/mock/datasets.json"
import { supabase } from "@/lib/supabase"

export type DatasetType =
  | "model"
  | "process"
  | "flow"
  | "flow_property"
  | "unit_group"
  | "source"
  | "contact"

export interface Dataset {
  id: string
  type: DatasetType
  name: string
  description: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface DatasetTypeInfo {
  type: DatasetType
  label: string
}

export const DATASET_TYPES: DatasetTypeInfo[] = [
  { type: "model", label: "Models" },
  { type: "process", label: "Processes" },
  { type: "flow", label: "Flows" },
  { type: "flow_property", label: "Flow Properties" },
  { type: "unit_group", label: "Unit Groups" },
  { type: "source", label: "Sources" },
  { type: "contact", label: "Contacts" },
]

export function getDatasetTypeInfo(type: string): DatasetTypeInfo | undefined {
  return DATASET_TYPES.find((t) => t.type === type)
}

export async function listDatasets(type: DatasetType): Promise<Dataset[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("datasets")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data as Dataset[]
  }

  return (mockDatasets as Dataset[]).filter((d) => d.type === type)
}

export async function getDataset(id: string): Promise<Dataset | undefined> {
  if (supabase) {
    const { data, error } = await supabase
      .from("datasets")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return data ?? undefined
  }

  return (mockDatasets as Dataset[]).find((d) => d.id === id)
}

export interface NewDataset {
  type: DatasetType
  name: string
  description: string | null
  payload: Record<string, unknown>
}

export async function createDataset(input: NewDataset): Promise<Dataset> {
  if (!supabase) {
    throw new Error("Supabase is not configured, so datasets can't be added.")
  }
  const { data, error } = await supabase
    .from("datasets")
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as Dataset
}

export async function updateDataset(id: string, input: NewDataset): Promise<Dataset> {
  if (!supabase) {
    throw new Error("Supabase is not configured, so datasets can't be edited.")
  }
  const { data, error } = await supabase
    .from("datasets")
    .update(input)
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as Dataset
}

export async function deleteDataset(id: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured, so datasets can't be deleted.")
  }
  const { error } = await supabase.from("datasets").delete().eq("id", id)
  if (error) throw error
}
