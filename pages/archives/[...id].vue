<!-- redirect to /posts/:id -->

<template>
  <div />
</template>

<script lang="ts" setup>
const route = useRoute()
const router = useRouter()

const rawId = route.params?.id
const id = Array.isArray(rawId) ? rawId.join('/') : rawId

if (id) {
  router.replace(`/posts/${id}`)
}
</script>
