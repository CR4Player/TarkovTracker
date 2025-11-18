<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div style="background: red; padding: 20px; color: white; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">
    LAYOUT IS WORKING!
  </div>
  <div style="padding: 8px; margin-top: 60px;">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Minimal test - no imports, no components, just basic layout
</script>
