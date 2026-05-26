/**
 * This module provides functions to generate and play sounds with specified duration and frequency.
 * A single AudioContext is reused across all calls — browsers cap concurrent instances (~6 in Chrome).
 */

import { log } from '@/utils/debug';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
        void audioCtx.resume();
    }

    return audioCtx;
}

export function beepAction() {
    log('sound', `beepAction at ${Math.round(performance.now())}ms`);
    playBeep(1850, 50, 0.3);
}

export function beepTime() {
    log('sound', `beepTime at ${Math.round(performance.now())}ms`);
    playBeep(1200, 300, 0.4);
}

export function beepTimeout() {
    log('sound', `beepTimeout at ${Math.round(performance.now())}ms`);
    playBeep(1050, 1000, 0.6);
}

export function playBeep(
    HzFrequency: number = 1000,
    msDuration: number = 500,
    volume: number = 0.2
): void {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = HzFrequency;
    gainNode.gain.value = volume;

    oscillator.start();
    oscillator.stop(ctx.currentTime + msDuration / 1000);

    oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
    };
}
