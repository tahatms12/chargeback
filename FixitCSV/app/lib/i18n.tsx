import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "de" | "tr" | "fr";

type Dictionary = Record<string, string>;

const STORAGE_KEY = "fixitcsv.locale";

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    "lang.english": "English",
    "lang.german": "German",
    "lang.turkish": "Turkish",
    "lang.french": "French",
    "lang.label": "Language",
    "nav.home": "FixitCSV",
    "page.title": "Shopify CSV Pre-Import Validator",
    "upload.title": "Upload product CSV",
    "upload.desc": "CSV validation is fully client-side. CSV contents are never stored server-side.",
    "upload.actionTitle": "Upload CSV",
    "upload.actionHint": "Client-side validation only; file is not uploaded to server",
    "upgrade.required": "Upgrade required",
    "upgrade.toPro": "Upgrade to Pro",
    "upgrade.proPrice": "Upgrade to Pro ($7/month)",
    "upgrade.paywall": "This file has {{count}} rows and exceeds your remaining free-tier quota.",
    "status.passed": "Passed",
    "status.errors": "{{count}} errors",
    "status.warnings": "{{count}} warnings",
    "errors.unknownHeaders": "Unknown headers: {{headers}}",
    "errors.rowIssue": "Row {{row}} • {{column}} • {{message}} Fix: {{fix}}",
    "errors.outOfScope": "Out of scope: Shopify server-side import failures, image CDN failures, and API rate limits.",
    "usage.proActive": "FixitCSV Pro active. Unlimited validations.",
    "usage.limitReachedTitle": "Free-tier limit reached",
    "usage.limitReachedBody": "You have used {{used}}/{{limit}} rows this month.",
    "usage.freeTierBody": "Free tier: {{used}}/{{limit}} rows used this month.",
    "validation.missingRequiredColumn": "Missing required column: \"{{column}}\".",
    "validation.utf8Issue": "Potential UTF-8 encoding issue detected.",
    "validation.utf8Fix": "Re-save the CSV in UTF-8 format.",
    "validation.handleRequired": "Handle is required.",
    "validation.handleRequiredFix": "Add a non-empty handle.",
    "validation.invalidHandle": "Invalid handle \"{{handle}}\".",
    "validation.invalidHandleFix": "Use lowercase letters, numbers, and hyphens only.",
    "validation.titleRequired": "Title is required on the first row of each handle group.",
    "validation.titleRequiredFix": "Add Title on the first row for this Handle.",
    "validation.priceRequired": "Variant Price is required.",
    "validation.priceRequiredFix": "Add a numeric Variant Price.",
    "validation.priceNumeric": "Variant Price must be numeric.",
    "validation.priceNumericFix": "Use a plain number like 19.99.",
    "validation.compareNumeric": "Compare At Price must be numeric.",
    "validation.compareNumericFix": "Use a plain number or leave blank.",
    "validation.compareLower": "Compare At Price is lower than Variant Price.",
    "validation.compareLowerFix": "Set Compare At Price above Variant Price or clear it.",
    "validation.boolField": "{{field}} must be TRUE or FALSE.",
    "validation.boolFieldFix": "Set to TRUE or FALSE.",
    "validation.numericField": "{{field}} must be numeric.",
    "validation.numericFieldFix": "Use a numeric value.",
    "validation.integerField": "{{field}} must be a whole number.",
    "validation.integerFieldFix": "Use an integer.",
    "validation.invalidEnum": "{{field}} contains an invalid value.",
    "validation.invalidEnumFix": "Use one of: {{values}}.",
    "validation.invalidUrl": "{{field}} must be a valid URL.",
    "validation.invalidUrlFix": "Use a full http:// or https:// URL.",
    "validation.invalidBarcode": "Barcode must be GTIN-8/12/13/14 digits.",
    "validation.invalidBarcodeFix": "Use only digits with 8, 12, 13, or 14 length.",
    "validation.optionRequired": "{{field}} required for variant rows.",
    "validation.optionRequiredFix": "Provide {{field}} for {{option}}.",
    "validation.nonContiguousHandle": "Handle group appears non-contiguous.",
    "validation.nonContiguousHandleFix": "Keep rows for a given handle grouped together.",
  },
  de: {
    "lang.english": "Englisch",
    "lang.german": "Deutsch",
    "lang.turkish": "Türkisch",
    "lang.french": "Französisch",
    "lang.label": "Sprache",
    "nav.home": "FixitCSV",
    "page.title": "Shopify CSV-Validator vor dem Import",
    "upload.title": "Produkt-CSV hochladen",
    "upload.desc": "Die CSV-Prüfung läuft vollständig im Browser. CSV-Inhalte werden serverseitig nicht gespeichert.",
    "upload.actionTitle": "CSV hochladen",
    "upload.actionHint": "Nur Browser-Prüfung; die Datei wird nicht auf den Server hochgeladen",
    "upgrade.required": "Upgrade erforderlich",
    "upgrade.toPro": "Auf Pro upgraden",
    "upgrade.proPrice": "Auf Pro upgraden (7 $/Monat)",
    "upgrade.paywall": "Diese Datei hat {{count}} Zeilen und überschreitet Ihr verbleibendes Freikontingent.",
    "status.passed": "Bestanden",
    "status.errors": "{{count}} Fehler",
    "status.warnings": "{{count}} Warnungen",
    "errors.unknownHeaders": "Unbekannte Spalten: {{headers}}",
    "errors.rowIssue": "Zeile {{row}} • {{column}} • {{message}} Korrektur: {{fix}}",
    "errors.outOfScope": "Nicht enthalten: Shopify-Importfehler auf Serverseite, CDN-Bildfehler und API-Limits.",
    "usage.proActive": "FixitCSV Pro aktiv. Unbegrenzte Prüfungen.",
    "usage.limitReachedTitle": "Freikontingent erreicht",
    "usage.limitReachedBody": "Sie haben diesen Monat {{used}}/{{limit}} Zeilen genutzt.",
    "usage.freeTierBody": "Free-Tarif: {{used}}/{{limit}} Zeilen diesen Monat verwendet.",
    "validation.missingRequiredColumn": "Erforderliche Spalte fehlt: \"{{column}}\".",
    "validation.utf8Issue": "Möglicher UTF-8-Kodierungsfehler erkannt.",
    "validation.utf8Fix": "Speichern Sie die CSV erneut im UTF-8-Format.",
    "validation.handleRequired": "Handle ist erforderlich.",
    "validation.handleRequiredFix": "Fügen Sie ein nicht-leeres Handle hinzu.",
    "validation.invalidHandle": "Ungültiges Handle \"{{handle}}\".",
    "validation.invalidHandleFix": "Verwenden Sie nur Kleinbuchstaben, Zahlen und Bindestriche.",
    "validation.titleRequired": "Titel ist in der ersten Zeile jeder Handle-Gruppe erforderlich.",
    "validation.titleRequiredFix": "Tragen Sie den Titel in der ersten Zeile für dieses Handle ein.",
    "validation.priceRequired": "Variant Price ist erforderlich.",
    "validation.priceRequiredFix": "Fügen Sie einen numerischen Variant Price hinzu.",
    "validation.priceNumeric": "Variant Price muss numerisch sein.",
    "validation.priceNumericFix": "Verwenden Sie eine Zahl wie 19.99.",
    "validation.compareNumeric": "Compare At Price muss numerisch sein.",
    "validation.compareNumericFix": "Verwenden Sie eine Zahl oder lassen Sie das Feld leer.",
    "validation.compareLower": "Compare At Price ist niedriger als Variant Price.",
    "validation.compareLowerFix": "Setzen Sie Compare At Price über Variant Price oder leeren Sie das Feld.",
    "validation.boolField": "{{field}} muss TRUE oder FALSE sein.",
    "validation.boolFieldFix": "Auf TRUE oder FALSE setzen.",
    "validation.numericField": "{{field}} muss numerisch sein.",
    "validation.numericFieldFix": "Verwenden Sie einen numerischen Wert.",
    "validation.integerField": "{{field}} muss eine ganze Zahl sein.",
    "validation.integerFieldFix": "Verwenden Sie eine Ganzzahl.",
    "validation.invalidEnum": "{{field}} enthält einen ungültigen Wert.",
    "validation.invalidEnumFix": "Verwenden Sie einen der folgenden Werte: {{values}}.",
    "validation.invalidUrl": "{{field}} muss eine gültige URL sein.",
    "validation.invalidUrlFix": "Verwenden Sie eine vollständige http://- oder https://-URL.",
    "validation.invalidBarcode": "Barcode muss 8/12/13/14 GTIN-Ziffern enthalten.",
    "validation.invalidBarcodeFix": "Nur Ziffern mit 8, 12, 13 oder 14 Stellen verwenden.",
    "validation.optionRequired": "{{field}} ist für Variantenzeilen erforderlich.",
    "validation.optionRequiredFix": "{{field}} für {{option}} angeben.",
    "validation.nonContiguousHandle": "Handle-Gruppe scheint nicht zusammenhängend zu sein.",
    "validation.nonContiguousHandleFix": "Zeilen je Handle zusammenhängend gruppieren.",
  },
  tr: {
    "lang.english": "İngilizce",
    "lang.german": "Almanca",
    "lang.turkish": "Türkçe",
    "lang.french": "Fransızca",
    "lang.label": "Dil",
    "nav.home": "FixitCSV",
    "page.title": "Shopify CSV İçe Aktarım Öncesi Doğrulayıcı",
    "upload.title": "Ürün CSV'si yükleyin",
    "upload.desc": "CSV doğrulaması tamamen istemci tarafında çalışır. CSV içeriği sunucuda saklanmaz.",
    "upload.actionTitle": "CSV yükle",
    "upload.actionHint": "Yalnızca istemci tarafı doğrulama; dosya sunucuya yüklenmez",
    "upgrade.required": "Yükseltme gerekli",
    "upgrade.toPro": "Pro'ya yükselt",
    "upgrade.proPrice": "Pro'ya yükselt (7$/ay)",
    "upgrade.paywall": "Bu dosya {{count}} satır içeriyor ve kalan ücretsiz kotanızı aşıyor.",
    "status.passed": "Başarılı",
    "status.errors": "{{count}} hata",
    "status.warnings": "{{count}} uyarı",
    "errors.unknownHeaders": "Bilinmeyen başlıklar: {{headers}}",
    "errors.rowIssue": "Satır {{row}} • {{column}} • {{message}} Düzeltme: {{fix}}",
    "errors.outOfScope": "Kapsam dışı: Shopify sunucu tarafı içe aktarma hataları, CDN görsel hataları ve API hız limitleri.",
    "usage.proActive": "FixitCSV Pro aktif. Sınırsız doğrulama.",
    "usage.limitReachedTitle": "Ücretsiz katman limiti doldu",
    "usage.limitReachedBody": "Bu ay {{used}}/{{limit}} satır kullandınız.",
    "usage.freeTierBody": "Ücretsiz katman: Bu ay {{used}}/{{limit}} satır kullanıldı.",
    "validation.missingRequiredColumn": "Gerekli sütun eksik: \"{{column}}\".",
    "validation.utf8Issue": "Olası UTF-8 kodlama sorunu tespit edildi.",
    "validation.utf8Fix": "CSV dosyasını UTF-8 formatında tekrar kaydedin.",
    "validation.handleRequired": "Handle alanı zorunludur.",
    "validation.handleRequiredFix": "Boş olmayan bir handle ekleyin.",
    "validation.invalidHandle": "Geçersiz handle \"{{handle}}\".",
    "validation.invalidHandleFix": "Yalnızca küçük harf, rakam ve kısa çizgi kullanın.",
    "validation.titleRequired": "Her handle grubunun ilk satırında başlık zorunludur.",
    "validation.titleRequiredFix": "Bu handle için ilk satıra Title ekleyin.",
    "validation.priceRequired": "Variant Price zorunludur.",
    "validation.priceRequiredFix": "Sayısal bir Variant Price ekleyin.",
    "validation.priceNumeric": "Variant Price sayısal olmalıdır.",
    "validation.priceNumericFix": "19.99 gibi düz bir sayı kullanın.",
    "validation.compareNumeric": "Compare At Price sayısal olmalıdır.",
    "validation.compareNumericFix": "Sayısal bir değer kullanın veya boş bırakın.",
    "validation.compareLower": "Compare At Price, Variant Price değerinden düşük.",
    "validation.compareLowerFix": "Compare At Price değerini yükseltin veya alanı temizleyin.",
    "validation.boolField": "{{field}} TRUE veya FALSE olmalıdır.",
    "validation.boolFieldFix": "TRUE veya FALSE olarak ayarlayın.",
    "validation.numericField": "{{field}} sayısal olmalıdır.",
    "validation.numericFieldFix": "Sayısal bir değer girin.",
    "validation.integerField": "{{field}} tam sayı olmalıdır.",
    "validation.integerFieldFix": "Tam sayı kullanın.",
    "validation.invalidEnum": "{{field}} geçersiz bir değer içeriyor.",
    "validation.invalidEnumFix": "Şunlardan birini kullanın: {{values}}.",
    "validation.invalidUrl": "{{field}} geçerli bir URL olmalıdır.",
    "validation.invalidUrlFix": "Tam bir http:// veya https:// URL'si kullanın.",
    "validation.invalidBarcode": "Barkod GTIN-8/12/13/14 basamaklarından biri olmalıdır.",
    "validation.invalidBarcodeFix": "Yalnızca 8, 12, 13 veya 14 haneli rakamlar kullanın.",
    "validation.optionRequired": "{{field}} varyant satırları için zorunludur.",
    "validation.optionRequiredFix": "{{option}} için {{field}} girin.",
    "validation.nonContiguousHandle": "Handle grubu bitişik görünmüyor.",
    "validation.nonContiguousHandleFix": "Aynı handle'a ait satırları birlikte tutun.",
  },
  fr: {
    "lang.english": "Anglais",
    "lang.german": "Allemand",
    "lang.turkish": "Turc",
    "lang.french": "Français",
    "lang.label": "Langue",
    "nav.home": "FixitCSV",
    "page.title": "Validateur CSV Shopify avant import",
    "upload.title": "Importer un CSV produit",
    "upload.desc": "La validation du CSV est entièrement côté client. Le contenu du CSV n'est jamais stocké côté serveur.",
    "upload.actionTitle": "Importer le CSV",
    "upload.actionHint": "Validation côté client uniquement ; le fichier n'est pas envoyé au serveur",
    "upgrade.required": "Mise à niveau requise",
    "upgrade.toPro": "Passer à Pro",
    "upgrade.proPrice": "Passer à Pro (7 $/mois)",
    "upgrade.paywall": "Ce fichier contient {{count}} lignes et dépasse votre quota gratuit restant.",
    "status.passed": "Validé",
    "status.errors": "{{count}} erreurs",
    "status.warnings": "{{count}} avertissements",
    "errors.unknownHeaders": "En-têtes inconnus : {{headers}}",
    "errors.rowIssue": "Ligne {{row}} • {{column}} • {{message}} Correction : {{fix}}",
    "errors.outOfScope": "Hors périmètre : échecs d'import Shopify côté serveur, échecs CDN d'images et limites de débit API.",
    "usage.proActive": "FixitCSV Pro actif. Validations illimitées.",
    "usage.limitReachedTitle": "Limite du forfait gratuit atteinte",
    "usage.limitReachedBody": "Vous avez utilisé {{used}}/{{limit}} lignes ce mois-ci.",
    "usage.freeTierBody": "Forfait gratuit : {{used}}/{{limit}} lignes utilisées ce mois-ci.",
    "validation.missingRequiredColumn": "Colonne obligatoire manquante : \"{{column}}\".",
    "validation.utf8Issue": "Problème d'encodage UTF-8 potentiel détecté.",
    "validation.utf8Fix": "Réenregistrez le CSV au format UTF-8.",
    "validation.handleRequired": "Le handle est obligatoire.",
    "validation.handleRequiredFix": "Ajoutez un handle non vide.",
    "validation.invalidHandle": "Handle invalide \"{{handle}}\".",
    "validation.invalidHandleFix": "Utilisez uniquement des lettres minuscules, des chiffres et des tirets.",
    "validation.titleRequired": "Le titre est obligatoire sur la première ligne de chaque groupe de handle.",
    "validation.titleRequiredFix": "Ajoutez le titre sur la première ligne de ce handle.",
    "validation.priceRequired": "Variant Price est obligatoire.",
    "validation.priceRequiredFix": "Ajoutez un Variant Price numérique.",
    "validation.priceNumeric": "Variant Price doit être numérique.",
    "validation.priceNumericFix": "Utilisez un nombre simple comme 19.99.",
    "validation.compareNumeric": "Compare At Price doit être numérique.",
    "validation.compareNumericFix": "Utilisez un nombre simple ou laissez vide.",
    "validation.compareLower": "Compare At Price est inférieur à Variant Price.",
    "validation.compareLowerFix": "Définissez Compare At Price au-dessus de Variant Price ou videz le champ.",
    "validation.boolField": "{{field}} doit être TRUE ou FALSE.",
    "validation.boolFieldFix": "Définissez sur TRUE ou FALSE.",
    "validation.numericField": "{{field}} doit être numérique.",
    "validation.numericFieldFix": "Utilisez une valeur numérique.",
    "validation.integerField": "{{field}} doit être un nombre entier.",
    "validation.integerFieldFix": "Utilisez un entier.",
    "validation.invalidEnum": "{{field}} contient une valeur invalide.",
    "validation.invalidEnumFix": "Utilisez l'une des valeurs suivantes : {{values}}.",
    "validation.invalidUrl": "{{field}} doit être une URL valide.",
    "validation.invalidUrlFix": "Utilisez une URL complète http:// ou https://.",
    "validation.invalidBarcode": "Le code-barres doit comporter 8/12/13/14 chiffres GTIN.",
    "validation.invalidBarcodeFix": "Utilisez uniquement des chiffres de longueur 8, 12, 13 ou 14.",
    "validation.optionRequired": "{{field}} est obligatoire pour les lignes de variante.",
    "validation.optionRequiredFix": "Renseignez {{field}} pour {{option}}.",
    "validation.nonContiguousHandle": "Le groupe de handle semble non contigu.",
    "validation.nonContiguousHandleFix": "Gardez les lignes d'un même handle regroupées.",
  },
};

function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in dictionaries) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const t = useMemo(
    () => (key: string, vars?: Record<string, string | number>) => {
      return translate(locale, key, vars);
    },
    [locale],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
export function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const localized = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  return format(localized, vars);
}
