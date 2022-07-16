<script setup lang="ts">
import { toRefs, computed, ref } from "vue";
import type { Task, Board } from "@/types";
import { useAlerts } from "@/stores/alerts";
//import AppImageDropzone from "../../components/AppImageDropzone.vue";
import { useRouter } from "vue-router";


const alerts = useAlerts();
const router = useRouter();
// Define Props
const props = defineProps<{
  id: string;
}>();
const { id: boardId } = toRefs(props);

const board = ref({
  id: boardId?.value || "1",
  title: "Let's have an amazing time at Vue.js forge!! 🍍",
  order: JSON.stringify([
    { id: "1", title: "backlog 🌴", taskIds: ["1", "2"] },
  ]),
});
const tasks = ref<Partial<Task>[]>([
  { id: "1", title: "Code like mad people!" },
  { id: "2", title: "Push clean code" },
]);
const updateBoard = (b) => {
  board.value = b;
  alerts.success("Board updated!");
};

</script>

<template>
<BoardDragAndDrop
      :tasks="tasks"
      :board="board"
      @update="updateBoard"
      
    />
</template>