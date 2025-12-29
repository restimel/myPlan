import { reactive } from 'vue';
import type { StoredRoute } from '@/utils/storage';
import { holdManager, type HoldManager } from '@/utils/holds';

type Actions = 'openSettings';

export type RouteStore = HoldManager & {
    settings: RouteSettings;
    actionNeeded: Record<Actions, boolean>;

    /* Actions */
    initialize: (data: StoredRoute | null) => void;
    setSettings: (value?: RouteSettings) => void;
    setGrey: (options?: GreySettings) => void;
    needAction: (action: Actions, value?: boolean) => void;
};

const routeStore = reactive<RouteStore>({
    ...holdManager,
    settings: {
        routeName: '',
        greyedImage: {},
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
        this.settings.greyedImage.color = value?.greyedImage.color;
    },

    setGrey(options?: GreySettings) {
        if (!options) {
            this.settings.greyedImage.color = undefined;
            return;
        }

        this.settings.greyedImage.color = options.color;
    },

    needAction(action: Actions, value = true) {
        this.actionNeeded[action] = value;
    },

    /* }}} */
});

export default routeStore;
