<script setup lang="ts">
import type { Task } from "@/types";
import { ref, toRefs, computed } from "vue";
import { useRoute } from "vue-router";
import taskQuery from "@/graphql/queries/task.query.gql";
import { useQuery } from "@vue/apollo-composable";
import {
  Card,
  CardTitle,
  CardHeader,
  Avatar,
  CardSubtitle,
} from "@progress/kendo-vue-layout";
import { Chip } from "@progress/kendo-vue-buttons";
import { useDateFormat } from "@vueuse/core";

const props = defineProps<{
  task: Task;
}>();


const {
  result: taskData,
  onResult: onTaskLoad,
} = useQuery(
  taskQuery,
  { id: props.task.id },
  {
    fetchPolicy: "cache-and-network",
  }
);
const task = computed(() => taskData.value?.task || null);

onTaskLoad(() => {
  taskCopy.value = JSON.parse(JSON.stringify(taskData.value?.task));
});
const taskCopy = ref<Partial<Task> | null>(null);

const dateFormat = "MM/DD";

const route = useRoute();
</script>

<template>
  <RouterLink :to="`/boards/${route.params.id}/tasks/${props.task.id}`">
    <Card class="p-5 bg-white hover-card">
      <CardHeader>
        <div class="flex justify-between">
          <CardTitle>
            {{ task?.title }}
          </CardTitle>
          <Avatar type="image" size="medium" shape="circle">
            <img
              style="width: 45px; height: 45px"
              src="https://pickaface.net/gallery/avatar/unr_sample_161118_2054_ynlrg.png"
            />
          </Avatar>
        </div>
        <CardSubtitle>
          <chip
            v-if="task?.dueAt"
            :label="`Due ${useDateFormat(task.dueAt, dateFormat)}`"
            value="chip"
            rounded="full"
            icon="k-i-clock"
            theme-color="info"
          /> 
        </CardSubtitle>
      </CardHeader>
    </Card>
  </RouterLink>
</template>
