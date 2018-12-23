<template>
<v-card class="elevation-12">
    <v-toolbar dark>
        <v-toolbar-title>Playlist Manager</v-toolbar-title>
    </v-toolbar>
    <v-card-text>
        <p v-if="playlists.length === 0">
            You have no playlists configured.
        </p>
        <p v-else-if="no_active_musicsource">
            Select a music source before configuring playlists
        </p>
        <v-subheader>Playlist Criteria</v-subheader>
        <v-select :items="playlist_criteria" v-model="selected_playlist_criteria" />

            <v-data-table
                :headers="tbl_headers"
                :items="playlists"
                :loading="loading"
                v-if="selected_playlist_criteria"
            >
                <template slot="items" slot-scope="props">
                    <td>{{ props.item.playlist_name }}</td>
                    <td>{{ props.item[selected_playlist_criteria] }}</td>
                    <td class="justify-center layout px-0">
                        <v-icon small class="mr-2" @click="deletePlaylist(props.item)">delete</v-icon>
                    </td>
                </template>
            </v-data-table>

    </v-card-text>
    <v-card-actions>
        <v-btn @click="add_playlist_dialog = true"><v-icon class="mr-2">playlist_add</v-icon> Add Playlist</v-btn>
    </v-card-actions>

    <v-dialog v-model="add_playlist_dialog" max-width="500">
        <AddPlaylistStepper @cancel="onAddPlaylistCancel" @source-added="refreshPlaylists(); add_playlist_dialog = false"/>
    </v-dialog>

</v-card>
</template>
<script>

import axios from 'axios';
import AddPlaylistStepper from '../steppers/AddPlaylist.vue';

export default {
    components: {
        AddPlaylistStepper
    },

    data() {
        return {
            playlist_criteria: [{
                text: 'System Security',
                value: 'system_security'
            },{
                text: 'Region',
                value: 'region_id'
            }],
            tbl_headers: [{
                text: 'Playlist Name',
                value: 'playlist_name'
            },{
                text: 'Security',
                value: 'system_security'
            },{
                text: 'Actions',
                value: 'name',
                sortable: false
            }],
            selected_playlist_criteria: '',
            add_playlist_dialog: false,
            playlists: [],
            processing_playlist: false,
            loading: false,
            no_active_musicsource: false,
            processing_playlist_criteria: null
        }
    },

    computed: {
        musicsource_id() {
            return this.$store.state.active_musicsource_id;
        },

        hidden() {
            console.log('computed hidden:', this.$el);
            if (!this.$el) {
                return true;
            }
            // taken from jquery
            return !!(this.$el.offsetWidth || this.$el.offsetHeight || this.$el.getClientRects().length );
        }
    },

    watch: {
        selected_playlist_criteria(val) {
            console.log('val:', val);
            this.refreshPlaylists(val);
        },
        hidden(val) {
            console.log('hidden:', val);
            if (val !== true) {
                // this.refreshPlaylists();
            }
        }
    },

    methods: {
        onAddPlaylistCancel(newPlaylist) {
            if (newPlaylist) {
                if (this.selected_playlist_criteria) {
                    this.refreshPlaylists(this.selected_playlist_criteria);
                }
            }

            this.add_playlist_dialog = false;
        },

        deletePlaylist(playlist) {
            this.loading = true;
            axios.delete('/api/music_sources/linked/' + this.musicsource_id + '/playlistCriteria/' + playlist.id)
            .then((res) => {
                this.loading = false;
                var idx = 0;
                for (;idx < this.playlists.length; idx++) {
                    if (this.playlists[idx].id == playlist.id) {
                        this.playlists.splice(idx, 1);
                        break;
                    }
                }
            });
        },

        refreshPlaylists(criteria) {

            this.loading = true;

            if (!this.musicsource_id) {
                this.no_active_musicsource = true;
                this.loading = false;
            }

            axios.get('/api/music_sources/linked/' + this.musicsource_id + '/playlistCriteria?criteria=' + criteria)
            .then((res) => {
                if (criteria === 'system_security') {
                    this.tbl_headers.splice(1, 1, {
                        text: 'System Security',
                        value: 'system_security'
                    });
                } else if (criteria === 'region_id') {
                    this.tbl_headers.splice(1, 1, {
                        text: 'Region',
                        value: 'region_id'
                    });
                }

                this.playlists = res.data;
                this.loading = false;
            });
        }
    },
}
</script>
