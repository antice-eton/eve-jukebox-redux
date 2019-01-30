// There has to be a better way to dynamically include plugins???

import foobarSetup from './ejr-foobar/ui/setup.vue';
import spotifySetup from './ejr-spotify/ui/setup.vue';
import musicbeeSetup from './ejr-musicbee/ui/setup.vue';

export default {
    foobar: {
        label: 'Foobar',
        setup: foobarSetup
    },
    spotify: {
        label: 'Spotify',
        setup: spotifySetup
    },

    musicbee: {
        label: 'MusicBee',
        setup: musicbeeSetup
    }
};
