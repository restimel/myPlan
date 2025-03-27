<template>
    <Component :is="iconComponent" class="icon" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

type Icons =
    | 'delete'
    | 'down'
    | 'edit'
    | 'file'
    | 'link'
    | 'merge'
    | 'photo'
    | 'question'
    | 'size'
    | 'split'
    | 'unlink'
    | 'up'
    | 'view'
;

type Props = {
    icon: Icons;
}

const props = defineProps<Props>();

const mapElement = {
    delete: import('@/components/icons/IconDelete.vue'),
    down: import('@/components/icons/IconDelete.vue'),
    edit: import('@/components/icons/IconEdit.vue'),
    file: import('@/components/icons/IconFile.vue'),
    link: import('@/components/icons/IconLink.vue'),
    merge: import('@/components/icons/IconMerge.vue'),
    photo: import('@/components/icons/IconPhoto.vue'),
    question: import('@/components/icons/IconQuestion.vue'),
    size: import('@/components/icons/IconSize.vue'),
    split: import('@/components/icons/IconSplit.vue'),
    unlink: import('@/components/icons/IconUnlink.vue'),
    up: import('@/components/icons/IconUp.vue'),
    view: import('@/components/icons/IconView.vue'),
};

const iconComponent = computed(() => {
    const element = mapElement[props.icon];

    if (element) {
        return element;
    }

    return mapElement.question;
});
</script>
