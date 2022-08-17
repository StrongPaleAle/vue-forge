<script setup lang="ts">
import {
  Dialog as KDialog,
  DialogActionsBar as KDialogActionsBar,
} from "@progress/kendo-vue-dialogs";
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Editor as KEditor } from "@progress/kendo-vue-editor";
import { TextArea as KTextArea, Input as KInput } from "@progress/kendo-vue-inputs";
import { ref, toRefs, computed } from "vue";
import { Calendar as KCalendar } from "@progress/kendo-vue-dateinputs";
import taskQuery from "@/graphql/queries/task.query.gql";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { useAlerts } from "@/stores/alerts";
import updateTaskMutation from "@/graphql/mutations/updateTask.mutation.gql";
import addCommentToTask from "@/graphql/mutations/addCommentToTask.mutation.gql";
import type { Comment, Label, Task } from "@/types";
const props = defineProps<{
  taskId: string;
}>();
const { taskId } = toRefs(props);
const alerts = useAlerts();
// Init page data (board with tasks)
const {
  result: taskData,
  loading: loadingTask,
  onError: onTaskError,
  onResult: onTaskLoad,
} = useQuery(
  taskQuery,
  { id: taskId.value },
  {
    fetchPolicy: "cache-and-network",
  }
);
onTaskError(() => alerts.error("Error loading task"));
const task = computed(() => taskData.value?.task || null);
// convert to mutatable data to use with form
onTaskLoad(() => {
  taskCopy.value = JSON.parse(JSON.stringify(taskData.value?.task));
  labels.value = JSON.parse(JSON.stringify(taskData.value.task.labels.items));
  
  comments.value = JSON.parse(
    JSON.stringify(taskData.value.task.comments.items)
  );
  taskCopy.labels = labels.value;
  
});
const taskCopy = ref<Partial<Task> | null>(null);
const labels = ref<Partial<Label>[]>([]);
const comments = ref<Partial<Comment>[]>([]);
const newComment = ref("");
const editorIncrementToRerender = ref(0);


const { mutate: addComment, onDone: onCommentAdded } = useMutation(
  addCommentToTask
);
const handleNewComment = () => {
  if (!newComment.value) return;
  comments.value.push({ message: newComment.value });
  addComment({taskId: taskId.value, message: newComment.value});
  newComment.value = "";
  editorIncrementToRerender.value++;
  
};




// handle task updates
const { mutate: updateTask, onDone: onTaskUpdated,onError: onErrorUpdateTask } =
  useMutation(
    updateTaskMutation,
    {
      update(cache) {
        cache.updateQuery({ query: taskQuery}, (data) => ({
         
            ...data,
            ...taskCopy.value,
          
        }));
      },
    }
  );

  
const updateTaskOnClick = (title: string, description: string, date: Date) => {
  
  let UpId = taskId.value;
  updateTask({ id: taskId.value, title, description });
  
};
onErrorUpdateTask((error) => {
  console.error(error.message);
  alerts.error("Error updating task")
  
  });
onTaskUpdated(() => alerts.success("Task successfully updated!"));
onCommentAdded(() => alerts.success("Comment successfully added!"));
</script>

<template>
  <div>
    <AppLoader v-if="loadingTask" :overlay="true" />
    <KDialog
      v-if="taskCopy"
      :title="task?.title"
      @close="$router.push(`/boards/${$route.params.id}`)"
      class="overflow-auto"
    >
      <div class="sm:flex">
        <main>
          <div class="form-group mb-5">
            <label for="title" class="font-bold text-xl">
              <span class="k-icon k-i-align-left"></span>
              Title
            </label>
            <KInput 
              class="form-control block w-full py-1.5 text-2xl"
              id="title"
              v-model="taskCopy.title"></KInput>
            
          </div>
          <div class="form-group">
            <label for="description" class="font-bold text-xl">
              <span class="k-icon k-i-align-left"></span>
              Description
            </label>
            <KTextArea id="description" v-model="taskCopy.description" />
          </div>

          <div class="form-group mt-10">
            <label for="comments" class="font-bold text-xl">
              <span class="k-icon k-i-comment"></span>
              Comments
            </label>
            <KEditor
              @change="newComment = $event.html"
              :key="editorIncrementToRerender"
              id="comments"
              :tools="[
                ['Bold', 'Italic', 'Underline', 'Strikethrough'],
                ['AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify'],
                ['Indent', 'Outdent'],
                ['OrderedList', 'UnorderedList'],
                'FontSize',
                'FormatBlock',
                ['Undo', 'Redo'],
                ['Link', 'Unlink', 'InsertImage', 'ViewHtml'],
              ]"
              :content-style="{
                height: '200px',
              }"
            />
            <KButton :theme-color="'primary'" @click="handleNewComment"
              >Add Comment</KButton
            >
          </div>

          <div
            v-for="comment in comments"
            :key="comment.message"
            v-html="comment.message"
          ></div>

          <strong>Task</strong>
          <pre>{{ taskCopy }}</pre>
          <!-- <strong>Comments</strong>
          <pre>{{ comments }}</pre> -->
          <strong>Labels</strong>
          <pre>{{ labels }}</pre>
          
        </main>
        <aside
          class="pl-5 sm:w-[300px] border-t-gray-300 border-t-2 pt-5 mt-5 sm:border-t-0"
        >
          <ul class="m-auto">
            <li class="my-3">
              <strong class="text-xs mb-2 block">Task Labels</strong>
              <AppLabelsPicker
                :labels="[...labels]"
                :selected="labels"
                @selectionUpdate="labels = $event"
              />
            </li>
            <li class="my-3">
              <strong class="text-xs mb-2 block" for="calendar"
                >Task Due Date</strong
              >
              <KCalendar v-model="taskCopy.dueAt" />
            </li>
          </ul>
        </aside>
      </div>
      <KDialogActionsBar>
        <KButton @click="$router.push(`/boards/${$route.params.id}`)"
          >Cancel</KButton
        >
        <KButton theme-color="primary" @click="updateTaskOnClick(taskCopy?.title, taskCopy?.description, taskCopy?.dueAt)">Save Task</KButton>
      </KDialogActionsBar>
    </KDialog>
  </div>
</template>