<template>
<v-content>
    <v-container fill-height>
        <v-layout justify-center align-center>
            <v-flex shrink>
                <p>
                    Welcome to EJR
                </p>
            </v-flex>
        </v-layout>
    </v-container>
</v-content>
</template>
<script>

import axios from 'axios';

export default {
    data() {
        return {
            drawer: true,
            items: [
                {icon: 'touch_app', text: 'Reminders'}
            ]
        }
    },

    computed: {
        character_id() {
            return this.$store.state.active_character_id;
        },

        character_name() {
            return this.$store.state.active_character_name;
        },

        character_portrait() {
            return '/portraits/' + this.character_id + '_512.jpg';
        },

        characters() {
            return this.$store.state.characters;
        }
    }
}
</script>
