<template>
    <div class="language-selector">
        <button
            @click="changeLanguage()"
            class="current-language"
        >
            {{ locale.toLocaleUpperCase(locale) }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { locale, availableLocales } = useI18n();

const changeLanguage = () => {
    const lang = locale.value;
    const idx = availableLocales.indexOf(lang);
    const newIdx = (idx + 1) % availableLocales.length;
    const newLang = availableLocales[newIdx];

    locale.value = newLang;
    localStorage.setItem('language', newLang);
};
</script>
<style scoped>
.current-language {
    padding: 1px;
    background: transparent;
    color: var(--color-txt-primary);
    border: 1px solid var(--color-txt-primary);
    font-weight: 600;
    font-size: 0.9em;
}
</style>
