<template>
    <div class="about">
        <h1>{{  t('about.header') }}</h1>

        <label>
            {{ t('label.version') }}
            <output>{{ appVersion }}</output>
        </label>
        <label @dblclick="openDebug">
            {{ t('label.author') }}
            <output>Benoît Mariat</output>
        </label>
        <label>
            {{ t('label.licence') }}
            <output>{{ appLicence }}</output>
        </label>

        <figure>
            <img src="@/assets/url.png" alt="url to https://restimel.github.io/myPlan">
            <figcaption>
                https://restimel.github.io/myPlan
            </figcaption>
        </figure>
    </div>
</template>

<script lang="ts" setup>
import { debug, debugMessage } from '@/utils/debug';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const appVersion = __APP_VERSION__;
const appLicence = __APP_LICENCE__;

function openDebug() {
    debug.value = true;
    debugMessage.value = 'Debug "on"';
}
</script>

<style scoped>
.about {
    padding: var(--section-padding);
}

label {
    display: block;
    font-weight: 700;
}

output {
    font-weight: normal;
}

figure {
    text-align: center;
}
</style>
