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
        <label>
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

        <section class="config-section">
            <h2>{{ t('config.title') }}</h2>
            <section class="config-subsection">
                <h3>{{ t('chronometer.title') }}</h3>
                <fieldset>
                    <legend>{{ t('config.keepScreenAwake') }}</legend>
                    <label v-for="option in keepScreenAwakeOptions" :key="option.value" class="radio-label">
                        <input
                            type="radio"
                            name="keepScreenAwake"
                            :value="option.value"
                            v-model="preferences.keepScreenAwake"
                        />
                        {{ option.label }}
                    </label>
                    <div class="test-area">
                        <div v-if="isTestMode" class="test-status">
                            <span class="status-dot" :class="keepAwakeStatus"></span>
                            <span>{{ t(`config.testStatus.${keepAwakeStatus}`) }}</span>
                        </div>
                        <p v-if="isTestMode" class="info">{{ t('config.testInstruction') }}</p>
                        <button
                            @click="toggleTest"
                            :disabled="testDisabled"
                            :class="{ 'primary-btn': isTestMode }"
                            :title="isAwakeActive && !isTestMode ? t('config.testInUse') : undefined"
                        >
                            <MyIcon :icon="isTestMode ? 'pause' : 'play'" />
                            {{ isTestMode ? t('config.stopTest') : t('config.test') }}
                        </button>
                    </div>
                </fieldset>
            </section>
        </section>

        <button v-if="!debug"
            class="btn-transparent activeDebug"
            @click="openDebug"
        >
            → Enable Debug mode
        </button>
        <label v-if="debug">
            Debug
            <output>
                <ManageDebug />
            </output>
        </label>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onUnmounted } from 'vue';
import { debug, debugMessage, enableDebug } from '@/utils/debug';
import { useI18n } from 'vue-i18n';
import ManageDebug from '@/components/debug/manageDebug.vue';
import MyIcon from '@/components/myIcon.vue';
import { preferencesStore as preferences } from '@/stores/PreferencesStore';
import { isAwakeActive, isTestMode, keepAwakeStatus, startTest, stopTest } from '@/utils/keepScreenAwake';

const { t } = useI18n();

const keepScreenAwakeOptions = computed(() => [
    { value: 'off', label: t('config.keepScreenAwakeOff') },
    { value: 'html5', label: t('config.keepScreenAwakeHtml5') },
    { value: 'canvas', label: t('config.keepScreenAwakeCanvas') },
    { value: 'video', label: t('config.keepScreenAwakeVideo') },
]);

const testDisabled = computed(() =>
    preferences.keepScreenAwake === 'off' || (isAwakeActive.value && !isTestMode.value)
);

function toggleTest() {
    if (isTestMode.value) {
        stopTest();
    } else {
        startTest();
    }
}

onUnmounted(() => {
    if (isTestMode.value) {
        stopTest();
    }
});

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

.config-section {
    margin-top: var(--field-margin);
}

.config-section h2 {
    text-align: start;
}

.config-subsection h3 {
    text-align: start;
    font-size: var(--font-size-md);
    margin-bottom: var(--field-padding);
}

fieldset {
    border: var(--field-border);
    border-radius: var(--border-radius-sm);
    padding: 0.5em 1em;
}

legend {
    font-weight: 700;
    padding: 0 0.25em;
}

.radio-label {
    display: flex;
    align-items: baseline;
    gap: 0.5em;
    font-weight: normal;
    cursor: pointer;
}

.test-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--field-padding-sm);
    margin-top: var(--field-padding);
}

.test-status {
    display: flex;
    align-items: center;
    gap: var(--field-padding-sm);
    font-weight: normal;
}

.status-dot {
    display: inline-block;
    width: 0.7em;
    height: 0.7em;
    border-radius: 50%;
    background: var(--vt-c-grey);
    flex-shrink: 0;
}

.status-dot.active   { background: var(--color-success); }
.status-dot.pending  { background: var(--color-warning); }
.status-dot.inactive { background: var(--color-error); }

.activeDebug {
    font-size: var(--font-size-xs);
    font-style: italic;
}
</style>
