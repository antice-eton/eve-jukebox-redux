<template>
<v-card>
    <v-card-text>
        <v-switch v-model="show_simple_security"
            label="Simple System Security"
            color="primary"/>
        <v-select :items="simple_security_choices" v-if="show_simple_security" v-model="selected_simple_security"/>
        <v-select :items="system_securities" multiple v-model="selected_system_securities" v-else/>
    </v-card-text>
    <v-card-actions>
        <v-btn @click="selected_system_securities = []; $emit('cancel')">Cancel</v-btn>
        <v-btn @click="$emit('next', selected_system_securities)">Next</v-btn>
    </v-card-actions>
</v-card>
</template>

<script>

export default {

    data() {
        return {
            show_simple_security: true,
            selected_system_securities: [],
            selected_simple_security: '',
            simple_security_choices: [
                'High Security (1.0 -> 0.5)',
                'Low Security (0.4 -> 0.1)',
                'Null Security (0.0 -> -1.0)'
            ]
        }
    },

    watch: {
        selected_simple_security(newVal) {
            if (newVal.startsWith('High Security'))  {
                this.selected_system_securities = this.high_securities;
            } else if (newVal.startsWith('Low Security')) {
                this.selected_system_securities = this.low_securities;
            } else if (newVal.startsWith('Null Security')) {
                this.selected_system_securities = this.null_securities;
            }
        },

        show_simple_security(newVal) {
            this.selected_simple_security = '';
        }
    },

    computed: {
        system_securities() {
            const securities = [];
            for (var i = 1.0; i >= -1.0; i = i - 0.1) {
                securities.push(Math.round(i * 10) / 10);
            }
            return securities;
        },

        high_securities() {
            const securities = [];
            for (var i = 1.0; i >= 0.5; i = i - 0.1) {
                securities.push(Math.round(i * 10) / 10);
            }

            return securities;
        },

        low_securities() {
            const securities = [];
            for (var i = 0.4; i >= 0.1; i = i - 0.1) {
                securities.push(Math.round(i * 10) / 10);
            }

            return securities;
        },

        null_securities() {
            const securities = [];
            for (var i = 0.0; i >= -1.0; i = i - 0.1) {
                securities.push(Math.round(i * 10) / 10);
            }

            return securities;
        }
    }
}


</script>
