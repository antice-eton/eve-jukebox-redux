<template>
    <v-content>
        <v-container>
            <v-layout wrap>
                <v-flex xs12>
                    <h1 class="mb-1 display-1">EVE Jukebox Redux</h1>
                </v-flex>
                <v-flex xs12>
                    <EveCharacterCard/>
                </v-flex>
                <v-flex xs12 class="mt-4">
                    <MusicCard/>
                </v-flex>
            </v-layout>
        </v-container>
    </v-content>
</template>
<script>

import EveCharacterCard from '../components/EveCharacterCard.vue';
import MusicCard from '../components/MusicCard.vue';
import axios from 'axios';

export default {
    components: {
        EveCharacterCard,
        MusicCard
    },

    created() {
        this.$connect();
    },

    beforeDestroy() {
        this.$disconnect();
    }
}
</script>
