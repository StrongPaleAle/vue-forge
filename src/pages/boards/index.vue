<script setup lang="ts">
import { useAlerts } from "@/stores/alerts";

import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import boardsQuery from "@/graphql/queries/boards.query.gql";
import createBoardMutation from "@/graphql/mutations/createBoard.mutation.gql";

const { result, loading, onError } = useQuery(boardsQuery);
const boards = computed(() => result.value?.boardsList?.items || []);

const alerts = useAlerts();

onError(() => alerts.error("Error loading boards!"));

const { mutate: createBoard } = useMutation(createBoardMutation, () => ({
  update(cache, { data: { boardCreate } }) {
    cache.updateQuery({ query: boardsQuery }, (res) => ({
      boardsList: {
        items: [...res.boardsList.items, boardCreate],
      },
    }));
  },
}));

// function createBoard() {
//   alerts.success("Board created!");
// }

const newBoardPayload = {
  data: {
    title: "New Board",
  },
};
</script>

<template>
  <div class="flex items-center justify-between my-5">
    <h1 class="text-3xl">Boards</h1>
    <button class="text-gray-500" @click="createBoard(newBoardPayload)">
      <span>New Board +</span>
    </button>
  </div>
  <div class="flex">
    <BoardCard v-for="board in boards" :key="board.id" :board="board" />
  </div>
  <AppLoader v-if="loading" :overlay="true" />
</template>
