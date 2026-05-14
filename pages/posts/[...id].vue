<!-- legacy /posts/:id → canonical /post/:id -->

<template>
  <div />
</template>

<script lang="ts" setup>
import { postPublicPath } from '~/constants/route-policy'

const route = useRoute()
const router = useRouter()

const rawId = route.params?.id
const id = Array.isArray(rawId) ? rawId.join('/') : rawId

if (id) {
  router.replace(postPublicPath(id))
}
</script>
