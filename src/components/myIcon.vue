<template>
    <component :is="iconComponent" class="icon"  :style="style" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import IconBug from '@/components/icons/IconBug.vue';
import IconDelete from '@/components/icons/IconDelete.vue';
import IconDown from '@/components/icons/IconDown.vue';
import IconEdit from '@/components/icons/IconEdit.vue';
import IconFile from '@/components/icons/IconFile.vue';
import IconGithub from '@/components/icons/IconGithub.vue';
import IconLink from '@/components/icons/IconLink.vue';
import IconMenu from '@/components/icons/IconMenu.vue';
import IconMerge from '@/components/icons/IconMerge.vue';
import IconPhoto from '@/components/icons/IconPhoto.vue';
import IconQuestion from '@/components/icons/IconQuestion.vue';
import IconSave from '@/components/icons/IconSave.vue';
import IconSize from '@/components/icons/IconSize.vue';
import IconSplit from '@/components/icons/IconSplit.vue';
import IconUnlink from '@/components/icons/IconUnlink.vue';
import IconUp from '@/components/icons/IconUp.vue';
import IconView from '@/components/icons/IconView.vue';

type Icons =
    | 'bug'
    | 'delete'
    | 'down'
    | 'edit'
    | 'file'
    | 'github'
    | 'link'
    | 'menu'
    | 'merge'
    | 'photo'
    | 'question'
    | 'save'
    | 'size'
    | 'split'
    | 'unlink'
    | 'up'
    | 'view'
;

type Props = {
    icon: Icons;
    size?: number;
}

const props = defineProps<Props>();

const mapElement = {
    bug: IconBug,
    delete: IconDelete,
    down: IconDown,
    edit: IconEdit,
    file: IconFile,
    github: IconGithub,
    link: IconLink,
    menu: IconMenu,
    merge: IconMerge,
    photo: IconPhoto,
    question: IconQuestion,
    save: IconSave,
    size: IconSize,
    split: IconSplit,
    unlink: IconUnlink,
    up: IconUp,
    view: IconView,
};

const iconComponent = computed(() => {
    const element = mapElement[props.icon];

    if (element) {
        return element;
    }

    return mapElement.question;
});

const style = computed(() => {
    return `
        --size: ${props.size ?? 15}px;
    `;
});
</script>

<style scoped>
.icon {
    height: var(--size);
    width: var(--size);
}
</style>
