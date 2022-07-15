<script setup lang="ts">
import type { Task } from "@/types";

const props = defineProps<{
  task: Task;
}>();
</script>

<template>
  <div class="p-5 bg-white">
    {{ task }}
  </div>
</template>