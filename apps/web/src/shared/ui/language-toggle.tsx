import { useTranslation } from "react-i18next";
import { i18n, type AppLanguage } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import "./language-toggle.css";

const languages: { value: AppLanguage; label: string }[] = [
  { value: "ru", label: "RU" },
  { value: "en", label: "EN" },
];

export function LanguageToggle() {
  const { t } = useTranslation("common");
  const current = (i18n.resolvedLanguage ?? i18n.language).startsWith("ru") ? "ru" : "en";

  return (
    <div className="language-toggle" role="group" aria-label={t("Language")}>
      {languages.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant={current === value ? "default" : "ghost"}
          className="language-toggle-option"
          aria-pressed={current === value}
          onClick={() => void i18n.changeLanguage(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
