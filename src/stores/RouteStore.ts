import { reactive } from 'vue';
import type { StoredRoute } from '@/utils/storage';

type Actions = 'openSettings';

export type RouteStore = {
    image: ImageData | null;
    holds: Hold[];
    settings: RouteSettings;
    actionNeeded: Record<Actions, boolean>;

    /* Actions */
    initialize: (data: StoredRoute | null) => void;
    setSettings: (value?: RouteSettings) => void;
    needAction: (action: Actions, value?: boolean) => void;
};

const routeStore = reactive<RouteStore>({
    image: null,
    holds: [],
    settings: {
        routeName: '',
    },
    actionNeeded: {
        openSettings: false,
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

    needAction(action: Actions, value = true) {
        this.actionNeeded[action] = value;
    },

    /* }}} */
});

export default routeStore;
