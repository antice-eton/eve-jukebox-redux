<template>
<v-layout row wrap>
    <Account/>
</v-layout>
</template>

<script>

import axios from 'axios';


import Account from './eve/Account.vue';

export default {
    components: {
        Account
    }
}

</script>
