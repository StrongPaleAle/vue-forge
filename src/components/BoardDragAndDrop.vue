<script setup lang="ts">
import { cloneDeep } from "lodash-es";
import { reactive, watch, toRaw } from "vue";
import type { Board, Column, Task } from "@/types";
import { v4 as uuidv4 } from "uuid";
import draggable from "vuedraggable";
import TaskCard from "./TaskCard.vue";
import { useAlerts } from "@/stores/alerts";
const alerts = useAlerts();
// props
const props = defineProps<{
  board: Board;
  tasks: Task[];
  addTask(task: Partial<Task>): Promise<Task>;
}>();

// events
const emit = defineEmits<{
  (e: "update", payload: Partial<Board>): void;
}>();

// local data
const tasks = reactive(cloneDeep(props.tasks));
const board = reactive(cloneDeep(props.board));
const columns = reactive<Column[]>(
  typeof board.order === "string"
    ? JSON.parse(board.order as string)
    : board.order
);

// methods
function addColumn() {
  columns.push({
    id: uuidv4(),
    title: "New Column",
    taskIds: [],
  });
}

watch(columns, () => {
  emit(
    "update",
    cloneDeep({ ...props.board, order: JSON.stringify(toRaw(columns)) })
  );
});

async function addTask({ column, title }: { column: Column; title: string }) {
  const newTask = { title };
  try {
    const savedTask = await props.addTask(newTask);
    tasks.push({ ...savedTask });
    column.taskIds.push(savedTask.id);
  } catch (error) {
    alerts.error("Error creating task!");
  }
}
</script>

<template>
  <div class="flex pt-4 pb-12 items-start  max-w-full overflow-x-auto">
    <draggable
      :list="columns"
      group="columns"
      item-key="id"
      class="flex overflow-x-auto flex-grow-0 flex-shrink-0 py-8"
    >
      <template #item="{ element: column }">
        <div
          class="column bg-gray-100 flex flex-col justify-between rounded-lg px-3 py-3 rounded mr-4 w-[300px] hover-card"
        >
          <div>
            <h3>
              <input
                type="text"
                :value="column.title"
                class="bg-transparent mb-2"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
                @blur="column.title = ($event.target as HTMLInputElement).value"
              />
            </h3>
            <draggable
              :list="column.taskIds"
              group="tasks"
              item-key="id"
              :animation="200"
              ghost-class="ghost-card"
              class="min-h-[400px]"
            >
              <template #item="{ element: taskId }">
                <TaskCard
                  v-if="tasks.find((t: Task) => t.id === taskId)"
                  :task="(tasks.find((t: Task) => t.id === taskId) as Task)"
                  class="mt-3 cursor-move"
                />
              </template>
            </draggable>
            <TaskCreator
              @create="
                addTask({
                  column,
                  title: $event,
                })
              "
            />
          </div>
        </div>
      </template>
    </draggable>
    <button class="text-gray-500 whitespace-nowrap pr-10 block mt-8" @click="addColumn">New Column +</button>
  </div>
</template>

