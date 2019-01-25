<template>
<td>
    <template v-for="type in criteria_types">
        <strong>{{ criteria_type_names[type] }}</strong><br/>
        <template v-for="value in criteria_type_values(type)">
            <span class="pl-2">{{ value }}</span><br/>
        </template>
    </template>
</td>
</template>

<script>

import criteria_types from '../../criteria_types.js';

export default {
    props: ['criteria'],

    data() {
        return {
            criteria_type_names: criteria_types.dict
        }
    },

    computed: {
        criteria_types() {
            const types = this.criteria.reduce((accumulator, criteria) => {
                if (accumulator.indexOf(criteria.type) === -1) {
                    accumulator.push(criteria.type);
                }
                return accumulator;
            },[]);

            return types;
        }
    },

    methods: {
        criteria_type_values(criteria_type) {
            const values = this.criteria.reduce((accumulator, criteria) => {
                if (criteria.type === criteria_type) {
                    if (criteria_type === 'system_security') {
                        if (criteria.criteria === 'high-sec') {
                            accumulator.push('High Sec');
                        } else if (criteria.criteria === 'low-sec') {
                            accumulator.push('Low Sec');
                        } else if (criteria.criteria === 'null-sec') {
                            accumulator.push('Null Sec');
                        } else {
                            accumulator.push(criteria.criteria);
                        }
                    } else {
                        accumulator.push(criteria.criteria.name);
                    }
                }
                return accumulator;
            }, []);

            return values;
        }
    }
}

</script>
