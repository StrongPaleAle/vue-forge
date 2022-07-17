<script setup lang="ts">
import { useAlerts } from "@/stores/alerts";
import type { Board } from "@/types";
import { useQuery } from "@vue/apollo-composable";
import { ref, computed } from "vue";
import boardsQuery from "../../graphql/queries/boards.query.gql";

const { result, loading, onError } = useQuery(boardsQuery);
const boards = computed(() => result.value?.boardsList?.items || []);

const alerts = useAlerts();

onError(() => alerts.error("Error loading boards!"));
function createBoard() {
  alerts.success("Board created!");
}
</script>

<template>
  <div class="flex items-center justify-between my-5">
    <h1 class="text-3xl">Boards</h1>
    <button class="text-gray-500" @click="createBoard()">
      <span>New Board +</span>
    </button>
  </div>
  <div class="flex">
    <BoardCard v-for="board in boards" :key="board.id" :board="board" />
  </div>
  <p v-if="loading">Loading...</p>
</template>
