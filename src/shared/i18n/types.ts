export const supportedLanguages = ["en", "hr", "es"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const fallbackLanguage: SupportedLanguage = "en";
