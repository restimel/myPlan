<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        fill="currentColor"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 32 32"
    >
        <!-- Arrow up: apex at top, base with gap before the magnifying glass -->
        <polygon points="13,1 19,6 7,6"/>
        <!-- Magnifying glass: hollow circle, shifted left to leave room for handle -->
        <circle cx="13" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2.5"/>
        <!-- "+" inside the magnifying glass -->
        <rect x="9" y="14.5" width="8" height="3" rx="0.5"/>
        <rect x="11.5" y="12" width="3" height="8" rx="0.5"/>
        <!-- Handle of the magnifying glass -->
        <line x1="19" y1="18.4" x2="28" y2="22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <!-- Arrow down: apex at bottom, base with gap after the magnifying glass -->
        <polygon points="13,31 7,26 19,26"/>
    </svg>
</template>
