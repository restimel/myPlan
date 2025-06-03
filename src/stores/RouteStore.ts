import { reactive } from 'vue';
import type { StoredRoute } from '@/utils/storage';

export type RouteStore = {
    image: ImageData | null;
    holds: Hold[];
    settings: RouteSettings;

    /* Actions */
    initialize: (data: StoredRoute | null) => void;
    setSettings: (value?: RouteSettings) => void;
};

const routeStore = reactive<RouteStore>({
    image: null,
    holds: [],
    settings: {
        routeName: '',
    },

    /* {{{ Actions */

    initialize(data: StoredRoute | null) {
        if (!data) {
            this.image = null;
            this.holds = [];
            this.setSettings();
            return;
        }

        this.image = data.image;
        this.holds = data.holds;
        this.setSettings(data.settings);
    },

    setSettings(value?: RouteSettings) {
        this.settings.routeName = value?.routeName ?? '';
    },

    /* }}} */
});

export default routeStore;
