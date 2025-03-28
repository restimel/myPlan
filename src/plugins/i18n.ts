import { createI18n } from 'vue-i18n';
import fr from '@/locales/fr';
import en from '@/locales/en';

export type Language = 'fr' | 'en';

export const locales: Language[] = [
    'en',
    'fr',
];
const DEFAULT_LOCALE = 'en';

function getLocale(): Language {
    const local = localStorage.getItem('language');

    if (!local) {
        const languages = (navigator.languages || [navigator.language]).map((lang) => lang.toLowerCase().split('-')[0]) as Language[];

        for (const lang of languages) {
            if (locales.includes(lang)) {
                return lang;
            }
        }

        return DEFAULT_LOCALE;
    }

    if (locales.includes(local as Language)) {
        return local as Language;
    }

    return DEFAULT_LOCALE;
}

/* Create and configure i18n instance */
const i18n = createI18n({
    legacy: false, /* Use Composition API */
    locale: getLocale(), /* Set initial locale */
    fallbackLocale: DEFAULT_LOCALE, /* Fallback if translation is missing */
    messages: {
        fr,
        en,
    },
});

export default i18n;
