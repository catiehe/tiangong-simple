import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LANGS, getLangText, setLangText, type LangText } from "@/lib/ilcd"

interface LangTextFieldProps {
  label: string
  value: LangText[]
  onChange: (value: LangText[]) => void
  required?: boolean
  multiline?: boolean
  id?: string
}

export function LangTextField({
  label,
  value,
  onChange,
  required,
  multiline,
  id,
}: LangTextFieldProps) {
  const Field = multiline ? Textarea : Input
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {LANGS.map((lang) => (
        <div key={lang} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2">
          <span className="text-muted-foreground w-24 shrink-0 pt-2 text-xs">
            {lang === "en" ? "English" : "简体中文"}
          </span>
          <Field
            id={id ? `${id}-${lang}` : undefined}
            required={required && lang === "en"}
            value={getLangText(value, lang)}
            onChange={(e) => onChange(setLangText(value, lang, e.target.value))}
            className="flex-1"
          />
        </div>
      ))}
    </div>
  )
}
