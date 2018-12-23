<template>
<v-card>
    <v-card-text>
        <v-select
            :items="criteria_types"
            v-model="criteria_type"
            label="Choose a criteria"/>
    </v-card-text>
    <v-card-actions>
        <v-btn @click="cancel">Cancel</v-btn>
        <v-btn @click="$emit('next', criteria_type)" :disabled="criteria_type === ''">Next</v-btn>
    </v-card-actions>
</v-card>
</template>

<script>

export default {
    methods: {
        cancel() {
            Object.assign(this.$data, this.$options.data());
            this.$emit('cancel');
        }
    },
    
    data() {
        return {
            criteria_type: '',
            criteria_types: [{
                value: 'system_security',
                text: 'System Security'
            },{
                value: 'region',
                text: 'Region'
            },{
                value: 'system',
                text: 'System'
            },{
                value: 'station',
                text: 'Station'
            }]
        }
    }
}

</script>
