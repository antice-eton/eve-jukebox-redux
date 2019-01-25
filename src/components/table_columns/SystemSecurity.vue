<template>
{{ system_security_name }}
</template>

<script>

const security_labels = {
    'high-sec': 'High Sec',
    'low-sec': 'Low Sec',
    'null-sec': 'Null Sec'
}

export default {

    props: ['value'],

    computed: {
        system_security_name() {
            if (security_labels[this.value]) {
                return security_labels[this.value];
            } else {
                return this.value;
            }
        }
    }
}
</script>
