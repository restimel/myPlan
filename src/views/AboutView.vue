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
            <img
                src="@/assets/url.png"
                alt="url to https://restimel.github.io/myPlan"
            >
            <figcaption>
                https://restimel.github.io/myPlan
            </figcaption>
        </figure>

        <label>
            <MyIcon icon="github" />
            {{ t('label.contribution') }}
            <output>
                <a href="https://github.com/restimel/myPlan" target="_blank">
                    https://github.com/restimel/myPlan
                </a>
            </output>
        </label>
        <label>
            <MyIcon icon="bug" />
            {{ t('label.bug') }}
            <output>
                <a href="https://github.com/restimel/myPlan/issues/new" target="_blank">
                    https://github.com/restimel/myPlan/issues/new
                </a>
                <span class="info">
                    ({{ t('about.toReportBug') }})
                </span>
            </output>
        </label>
        <label v-if="debug">
            Debug
            <output>
                <ManageDebug />
            </output>
        </label>
    </div>
</template>

<script lang="ts" setup>
import { debug, debugMessage, enableDebug } from '@/utils/debug';
import { useI18n } from 'vue-i18n';
import ManageDebug from '@/components/debug/manageDebug.vue';
import MyIcon from '@/components/myIcon.vue';

const { t } = useI18n();

const appVersion = __APP_VERSION__;
const appLicence = __APP_LICENCE__;

function openDebug() {
    enableDebug();
    debugMessage.value = 'Debug "on"';
}
</script>

<style scoped>
.about {
    padding: var(--section-padding);
    overflow: auto;
}

h1 {
    text-align: center;
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
    margin-top: var(--field-margin);
    margin-bottom: var(--field-margin);
}

@media (max-width: 400px) {
    figure {
        text-align: start;
    }
}

img {
    max-width: calc(100vw - 2 * var(--section-padding));
    max-height: 90vh;
}
</style>
