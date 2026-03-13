import { ref, reactive, watch, computed, readonly } from 'vue';
import { useWakeLock } from '@vueuse/core';
import { preferencesStore } from '@/stores/PreferencesStore';
import bgTimerSrc from '@/assets/bgTimer.webm';

/* {{{ HTML5 Wake Lock */

const wakeLock = reactive(useWakeLock());

/* }}} */
/* {{{ Video loop */

/** Play the video briefly every AWAKE_SLEEP ms to keep the screen on */
const AWAKE_RUN = 500;
const AWAKE_SLEEP = 5000;

const videoElement = ref<HTMLVideoElement | null>(null);
let awakeTimer = 0;

function videoPlay() {
    clearTimeout(awakeTimer);
    videoElement.value?.play();
    awakeTimer = setTimeout(videoPause, AWAKE_RUN);
}

function videoPause() {
    clearTimeout(awakeTimer);
    videoElement.value?.pause();
    awakeTimer = setTimeout(videoPlay, AWAKE_SLEEP);
}

function startVideo() {
    if (videoElement.value) {
        return;
    }

    const video = document.createElement('video');
    video.src = bgTimerSrc;
    video.muted = true;
    video.loop = true;
    video.setAttribute('playsinline', '');
    video.className = 'keep-awake-video';
    document.body.appendChild(video);
    videoElement.value = video;
    videoPlay();
}

function stopVideo() {
    clearTimeout(awakeTimer);
    awakeTimer = 0;

    if (!videoElement.value) {
        return;
    }

    videoElement.value.pause();
    videoElement.value.remove();
    videoElement.value = null;
}

/* }}} */

const _isAwakeActive = ref(false);
const _isTestMode = ref(false);

export const isAwakeActive = readonly(_isAwakeActive);
export const isTestMode = readonly(_isTestMode);

export const keepAwakeStatus = computed<'active' | 'pending' | 'inactive'>(() => {
    if (!_isAwakeActive.value) {
        return 'inactive';
    }

    const mode = preferencesStore.keepScreenAwake;

    if (mode === 'html5') {
        return wakeLock.isActive ? 'active' : 'pending';
    }

    if (mode === 'video') {
        return videoElement.value !== null ? 'active' : 'inactive';
    }

    return 'inactive';
});

function applyMode() {
    wakeLock.release();
    stopVideo();

    if (!_isAwakeActive.value) {
        return;
    }

    const mode = preferencesStore.keepScreenAwake;

    if (mode === 'html5') {
        wakeLock.request('screen');
    } else if (mode === 'video') {
        startVideo();
    }
}

export function requestKeepAwake(testMode = false) {
    _isTestMode.value = testMode;
    _isAwakeActive.value = true;
    applyMode();
}

export function releaseKeepAwake() {
    _isAwakeActive.value = false;
    _isTestMode.value = false;
    applyMode();
}

export function startTest() {
    requestKeepAwake(true);
}

export function stopTest() {
    _isTestMode.value = false;
    releaseKeepAwake();
}

watch(() => preferencesStore.keepScreenAwake, () => {
    if (_isAwakeActive.value) {
        applyMode();
    }
});
