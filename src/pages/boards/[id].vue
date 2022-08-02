<script setup lang="ts">
import { toRefs, computed, ref } from "vue";
import type { Task, Board } from "@/types";
import { useAlerts } from "@/stores/alerts";
//import AppImageDropzone from "../../components/AppImageDropzone.vue";
import { useRouter } from "vue-router";
import { v4 as uuidv4 } from "uuid";
import { useMutation  } from "@vue/apollo-composable";
import addTaskMutation from "@/graphql/mutations/addTask.mutation.gql";
import AppPageHeading from "../../components/AppPageHeading.vue";
import BoardMenu from "../../components/BoardMenu.vue";

const alerts = useAlerts();
const router = useRouter();
// Define Props
const props = defineProps<{
  id: string;
}>();
const { id: boardId } = toRefs(props);

const {mutate: crateTaskOnBoard, onDone: OnDoneCreatingTask, onError:  OnErrorCreatingTask} = useMutation(addTaskMutation)

let taskResolve = (task: Task) => {};
let taskReject = (message: Error) => {};

const board = ref({
  id: boardId?.value || "1",
  title: "Let's have an amazing time at Vue.js forge!! 🍍",
  order: JSON.stringify([{ id: "1", title: "backlog 🌴", taskIds: ["1", "2"] }]),
});
const tasks = ref<Partial<Task>[]>([
  {
    id: "1",
    title: "Code like mad people!",
    description: "Race against the clock",
    dueAt: new Date(),
  },
  {
    id: "2",
    title: "Push clean code",
    description: "Test and review code",
    dueAt: new Date(),
  },
]);

const addTask = async (task: Task) => {
  return new Promise((resolve, reject) => {
    taskResolve = resolve;
    taskReject = reject;
    resolve(crateTaskOnBoard({
      boardId: boardId?.value,
      ...task,
    })) 
  });
};

OnErrorCreatingTask((error) => { 
  taskReject(error);
  alerts.error("Error creating task!");
}
)
OnDoneCreatingTask((res) => {
  taskResolve(res.data.boardUpdate.tasks.items[0]);
  alerts.success("Task created!");
}
)

const updateBoard = (b: { id: string; title: string; order: string }) => {
  board.value = b;
  alerts.success("Board updated!");
};
const deleteBoardIfConfirmed = () => {
  console.log("delete board");
};
</script>

<template>
<div>
  <AppPageHeading>
    {{ board.title }}
  </AppPageHeading>
   <BoardMenu :board="board" @deleteBoard="deleteBoardIfConfirmed"/>
  <BoardDragAndDrop
    :tasks="tasks"
    :board="board"
    @update="updateBoard"
    :addTask="addTask"
  />
 
</div>
  
</template>
