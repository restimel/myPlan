<template>
    <component :is="iconComponent" class="icon"  :style="style" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import IconAdd from '@/components/icons/IconAdd.vue';
import IconBug from '@/components/icons/IconBug.vue';
import IconCancel from '@/components/icons/IconCancel.vue';
import IconChrono from '@/components/icons/IconChrono.vue';
import IconDelete from '@/components/icons/IconDelete.vue';
import IconDown from '@/components/icons/IconDown.vue';
import IconEdit from '@/components/icons/IconEdit.vue';
import IconFile from '@/components/icons/IconFile.vue';
import IconGithub from '@/components/icons/IconGithub.vue';
import IconLink from '@/components/icons/IconLink.vue';
import IconMagic from '@/components/icons/IconMagic.vue';
import IconMenu from '@/components/icons/IconMenu.vue';
import IconMerge from '@/components/icons/IconMerge.vue';
import IconNext from '@/components/icons/IconNext.vue';
import IconOk from '@/components/icons/IconOk.vue';
import IconPause from '@/components/icons/IconPause.vue';
import IconPhoto from '@/components/icons/IconPhoto.vue';
import IconPlay from '@/components/icons/IconPlay.vue';
import IconQuestion from '@/components/icons/IconQuestion.vue';
import IconRecapture from '@/components/icons/IconRecapture.vue';
import IconRestart from '@/components/icons/IconRestart.vue';
import IconSave from '@/components/icons/IconSave.vue';
import IconSettings from '@/components/icons/IconSettings.vue';
import IconSize from '@/components/icons/IconSize.vue';
import IconSplit from '@/components/icons/IconSplit.vue';
import IconUnlink from '@/components/icons/IconUnlink.vue';
import IconUp from '@/components/icons/IconUp.vue';
import IconView from '@/components/icons/IconView.vue';
import IconYouTube from '@/components/icons/IconYouTube.vue';

export type Icons =
    | 'add'
    | 'bug'
    | 'cancel'
    | 'chronometer'
    | 'delete'
    | 'down'
    | 'edit'
    | 'file'
    | 'github'
    | 'link'
    | 'magic'
    | 'menu'
    | 'merge'
    | 'next'
    | 'ok'
    | 'pause'
    | 'photo'
    | 'play'
    | 'question'
    | 'recapture'
    | 'restart'
    | 'save'
    | 'settings'
    | 'size'
    | 'split'
    | 'unlink'
    | 'up'
    | 'view'
    | 'youtube'
;

type Props = {
    icon: Icons;
    size?: number;
}

const props = defineProps<Props>();

const mapElement = {
    add: IconAdd,
    bug: IconBug,
    cancel: IconCancel,
    chronometer: IconChrono,
    delete: IconDelete,
    down: IconDown,
    edit: IconEdit,
    file: IconFile,
    github: IconGithub,
    link: IconLink,
    magic: IconMagic,
    menu: IconMenu,
    merge: IconMerge,
    next: IconNext,
    ok: IconOk,
    pause: IconPause,
    photo: IconPhoto,
    play: IconPlay,
    question: IconQuestion,
    recapture: IconRecapture,
    restart: IconRestart,
    save: IconSave,
    settings: IconSettings,
    size: IconSize,
    split: IconSplit,
    unlink: IconUnlink,
    up: IconUp,
    view: IconView,
    youtube: IconYouTube,
};

const iconComponent = computed(() => {
    const element = mapElement[props.icon];

    if (element) {
        return element;
    }

    return mapElement.question;
});

const style = computed(() => {
    if (props.size) {
        return `
            --size: ${props.size ?? 15}px;
        `;
    }

    return `
        --size: var(--icon-size, 15px);
    `;
});
</script>

<style scoped>
.icon {
    height: var(--size);
    width: var(--size);
}
</style>
