import { createRouter, createWebHashHistory } from 'vue-router';
import CreatePlanView from '@/views/createPlanView.vue';
import ViewPlanView from '@/views/viewPlanView.vue';

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/build',
        },
        {
            path: '/build',
            name: 'build',
            component: CreatePlanView,
        },
        {
            path: '/view',
            name: 'view',
            component: ViewPlanView,
        },
        {
            path: '/chronometer',
            name: 'chronometer',
            /* route level code-splitting */
            component: () => import('@/views/ChronometerView.vue'),
        },
        {
            path: '/about',
            name: 'about',
            /* route level code-splitting */
            component: () => import('@/views/AboutView.vue'),
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: '/build',
        },
    ],
});

export default router;
