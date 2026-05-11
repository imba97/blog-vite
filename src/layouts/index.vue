<template>
  <div class="min-h-screen site-shell">
    <Header />
    <Main />
    <FloatingActionGroup />
    <SearchDialog />
  </div>
</template>

<script lang="ts" setup>
import FloatingActionGroup from '~/components/floating-action-group.vue'
import SearchDialog from '~/components/SearchDialog.vue'
import { useSiteSearchBootstrap } from '~/composables/site-search-worker'
import Header from './header.vue'
import Main from './main.vue'

useSiteSearchBootstrap()
</script>
