<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-gray-100">
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
