// There has to be a better way to dynamically include plugins???

import foobarSetup from './ejr-foobar/ui/setup.vue';
import spotifySetup from './ejr-spotify/ui/setup.vue';

export default {
    foobar: {
        setup: foobarSetup
    },
    spotify: {
        setup: spotifySetup
    }
};
