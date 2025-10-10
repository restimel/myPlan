<template>
    <div
        class="chronometer-display"
        :class="{
            timeout: isTimeout,
            running: isRunning,
            warning: isWarning,
        }"
    >
        <div v-if="value < 0" class="sign">
            -
        </div>
        <div v-if="displayHours" class="double-digits">
            {{ hours }}
        </div>
        <div v-if="displayHours" class="separator">
            :
        </div>
        <div class="double-digits">
            {{ minutes }}
        </div>
        <div class="separator">
            :
        </div>
        <div class="double-digits">
            {{ seconds }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import { isRunning, isTimeout } from '@/stores/ChronometerStore';
import { computed } from 'vue';

const props = defineProps<{
    value: number;
    duration: number;
    warn?: boolean;
}>();

function pad(value: number): string {
    return value.toString(10).padStart(2, '0');
}

const valueSeconds = computed(() => Math.abs(props.value));

const hours = computed(() => {
    const value = valueSeconds.value;
    const hourValue = Math.floor(value / 3_600);

    return pad(hourValue);
});

const minutes = computed(() => {
    const value = valueSeconds.value;
    const minuteValue = Math.floor(value / 60) % 60;

    return pad(minuteValue);
});

const seconds = computed(() => {
    const value = valueSeconds.value;
    const secondValue = value % 60;

    return pad(secondValue);
});

const displayHours = computed(() => props.duration >= 3_600 || hours.value !== '00');

const isWarning = computed<boolean>(() => {
    return !!props.warn && !isTimeout.value && props.value <= 10;
});

</script>

<style scoped>
.chronometer-display {
    display: flex;
    flex-direction: row;
    justify-content: center;
    font-family: "Digital";
    cursor: pointer;
    width: 100%;

    background: var(--color-bg-chronometer);
    color: var(--vt-c-white-soft); /* default color */
    /* contrast color */
    color: hsl(from var(--color-bg-chronometer) 0 0 calc(clamp(0, 60 - l, 1) * 95%));
}
.chronometer-display.timeout {
    --color-bg-chronometer: var(--color-bg-chronometer-timeout);
}
.chronometer-display.running > .separator {
    animation: blink 1000ms steps(1) infinite;
}
.chronometer-display.running.warning {
    animation: limitWarning 1000ms steps(1) infinite;
}

@keyframes limitWarning {
    0% {
        color: var(--color-chronometer-warning);
    }
    30% {
        color: inherit;
    }
}
</style>
