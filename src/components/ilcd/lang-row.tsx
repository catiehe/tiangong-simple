import { LANGS, LANG_LABELS, getLangText, type LangText } from "@/lib/ilcd"

export function LangRow({ label, value }: { label: string; value: LangText[] }) {
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
