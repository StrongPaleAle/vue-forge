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
  CardFooter,
  Avatar,
  CardSubtitle,
} from "@progress/kendo-vue-layout";
import { Chip } from "@progress/kendo-vue-buttons";
import { useNow, useDateFormat } from "@vueuse/core";

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
  dateObject.value = new Date(task?.value.dueAt);
  
  
  
});
const taskCopy = ref<Partial<Task> | null>(null);
const dateObject = ref();
const dueAt = useDateFormat(dateObject, "MM/DD");



const route = useRoute();
</script>

<template>
  <RouterLink class="hover-card" :to="`/boards/${route.params.id}/tasks/${props.task.id}`">
    <Card class=" bg-white ">
      <div class="relative">
          <AppImage
        v-if="taskCopy?.image"
        :src="taskCopy?.image?.downloadUrl"
      />
      </div>
      
        <CardHeader>
          <div v-if="taskCopy?.labels?.items?.length > 0" class="flex flex-row flex-wrap gap-1 mb-2">
            <span
              v-for="label in taskCopy?.labels?.items"
              :class="`bg-${label.color}-500`"
              class="inline-block h-1 w-8 rounded-full"
            >
            </span>
          </div>
        
        <div class="flex justify-between">
          <CardTitle>
            {{ task?.title }}
    
          </CardTitle>
          
        </div>
      </CardHeader>
      <CardFooter>
        <chip
            v-if="task?.dueAt"
            :label="`Due ${dueAt}`"
            :text="`Due ${dueAt}`"
            value="chip"
            rounded="full"
            icon="k-i-clock"
            theme-color="info"
            class="text-xs"
          /> 
      </CardFooter>
      
      
      
    </Card>
  </RouterLink>
</template>
