<template>
  <div class="min-h-screen site-shell">
    <Header />
    <Main />
    <FloatingActionGroup />
  </div>
</template>

<script lang="ts" setup>
import FloatingActionGroup from '~/components/floating-action-group.vue'
import Header from './header.vue'
import Main from './main.vue'
</script>
