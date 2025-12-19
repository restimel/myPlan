/**
 * This module provides functions to generate and play sounds with specified duration and frequency.
 */

export function beepTime() {
    playBeep(1200, 300, 0.4);
}

export function beepTimeout() {
    playBeep(1050, 1000, 0.6);
}

export function playBeep(
    HzFrequency: number = 1000,
    msDuration: number = 500,
    volume: number = 0.2
): void {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = HzFrequency;
    gainNode.gain.value = volume;

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + msDuration / 1000);
}
