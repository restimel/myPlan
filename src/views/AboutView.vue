<template>
    <div class="about">
        <h1 @dblclick="displayPlatform = true">{{  t('about.header') }}</h1>
        <h2 v-if="context">{{ context }}</h2>
        <a v-if="displayPlatform"
            :href="linkToOppositePlatform"
        >
            {{ t(isTestPlatform ? 'about.goToDev' : 'about.goToTest')}}
        </a>

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
                class="qr-code"
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

        <img src="@/assets/logo.svg" alt="logo of myPLAN" class="logo" />

        <label v-if="debug">
            Debug
            <output>
                <ManageDebug />
            </output>
        </label>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { debug, debugMessage, enableDebug } from '@/utils/debug';
import { useI18n } from 'vue-i18n';
import ManageDebug from '@/components/debug/manageDebug.vue';
import MyIcon from '@/components/myIcon.vue';

const { t } = useI18n();

const appVersion = __APP_VERSION__;
const appLicence = __APP_LICENCE__;

const isTestPlatform = !!__CONTEXT__;
const displayPlatform = ref<boolean>(isTestPlatform || false);
const context = [import.meta.env.VITE_CONTEXT, __CONTEXT__].filter(Boolean).join(' ~~ ');

const linkToOppositePlatform = isTestPlatform ? '../' : './test/';

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

h1, h2 {
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

.qr-code {
    max-width: calc(100vw - 2 * var(--section-padding));
    max-height: 90vh;
}

.logo {
    width: 200px;
    max-width: 60vw;

    margin-left: auto;
    margin-right: auto;
    display: block;
}

@media (min-width: 750px) {
    .logo {
        position: absolute;
        top: var(--section-padding);
        right: var(--section-padding);
    }
}

</style>
