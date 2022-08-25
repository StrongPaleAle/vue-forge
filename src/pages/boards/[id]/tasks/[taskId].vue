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
import { useQuery, useMutation } from "@vue/apollo-composable";
import { useAlerts } from "@/stores/alerts";
import boardQuery from "@/graphql/queries/board.query.gql";
import taskQuery from "@/graphql/queries/task.query.gql";

import updateTaskMutation from "@/graphql/mutations/updateTask.mutation.gql";
import addCommentToTask from "@/graphql/mutations/addCommentToTask.mutation.gql";
import deleteTaskMutation from "@/graphql/mutations/deleteTask.mutation.gql";
import attachImageToTask from "@/graphql/mutations/attachImageToTask.mutation.gql";
import deleteImage from "@/graphql/mutations/deleteImageFromTask.mutation.gql";
import type { Comment, Label, Task } from "@/types";
import { useRouter } from "vue-router";


const props = defineProps<{
  taskId: string;
}>();
const { taskId } = toRefs(props);
const alerts = useAlerts();
const router = useRouter();

// TASK QUERY
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
  TaskLabels.value = JSON.parse(JSON.stringify(taskData.value.task.labels.items));
  
  comments.value = JSON.parse(
    JSON.stringify(taskData.value.task.comments.items)
  );
  dateObject.value = new Date(task?.value.dueAt);
  boardID.value = taskData.value?.task.board.id;
  boardOrder.value = taskData.value?.task.board.order;
  console.log(typeof boardOrder.value);
});



// Viariables

const taskCopy = ref<Partial<Task> | null>(null);
const TaskLabels = ref<Partial<Label>[]>([]);
const comments = ref<Partial<Comment>[]>([]);
const newComment = ref("");
const boardID = ref("");
const boardOrder = ref();
const dateObject = ref();
const editorIncrementToRerender = ref(0);


// ADD COMMENT TO TASK MUTATION
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

onCommentAdded(() => alerts.success("Comment successfully added!"));



// handle task updates
const { mutate: updateTask, onDone: onTaskUpdated,onError: onErrorUpdateTask } =
  useMutation(
    updateTaskMutation,
    {
      update(cache) {
        cache.updateQuery({ query: taskQuery}, (data) => {
          if (!data) return;
          const task = data.task;
          if (!task) return;
          task.value = { ...task.value, ...taskCopy.value };
          return data;
        });
      },
    }
  );

  
const updateTaskOnClick = (title: string, description: string, dueAt: Date) => {
  
  const dueString = dueAt.toISOString();
  console.log(title, description, dueString);
  taskCopy.dueAt = dueString;
  updateTask({ id: taskId.value, title, description, dueAt });
  
};

onErrorUpdateTask((error) => {
  console.error(error.message);
  alerts.error("Error updating task")
  
  });

onTaskUpdated(() => alerts.success("Task successfully updated!"));



const {
  mutate: attachImageTask,
  onError: errorAttachingImage,
  onDone: onImageAttached,
  loading: imageLoading,
} = useMutation(attachImageToTask,
  {
    update(cache) {
      cache.updateQuery({ query: taskQuery}, (data) => {
        if (!data) return;
        const task = data.task;
        if (!task) return;
        task.value = { ...task.value, ...taskCopy.value };
        return data;
      });
    },
  }
);

errorAttachingImage((error) => {
  console.log(error);
  alerts.error("Error setting task image");
});
onImageAttached((result) => {
  alerts.success("Image successfully attached!");
});

const { mutate: removeImageTask, onError: errorRemovingImage, onDone: onImageRemoved } = useMutation(deleteImage,
  {
    update(cache) {
    
      cache.updateQuery({ query: taskQuery,
      variables: {
        id: taskId.value,
      } }, 
      (res) => ({
        task: {
          ...res.task,
          image: null
        }
      }));
    }
  }
);
errorRemovingImage((error) => {
  console.log(error.message);
  alerts.error("Error deleting task image");
});
async function handleDeleteImage(imageID: string) {
  console.log(imageID);
  const yes = confirm("Are you sure you want to delete this image?");
  if (yes) {
    
    await removeImageTask({ id: taskId.value, imageId: imageID });
    
  }
}
onImageRemoved(() => {
  alerts.success("Image successfully removed!");
} );

const {mutate: deleteTask, onError: errorDeletingTask} = useMutation(deleteTaskMutation,
  {
    update(cache) {
      cache.updateQuery({ query: boardQuery,
      variables: {
        id: boardID.value,
      } }, 
      (res) => ({
        board: {
          ...res.board,
          tasks: {
            ...res.board.tasks,
            items: res.board.tasks.items.filter(
              (t: Task) => t.id !== taskId.value
            )
          }
        }
      }));
    }
  }
);
errorDeletingTask((error) => {
  console.log(error.message);
  alerts.error("Error deleting task");
} );
async function handleDeleteTask() {
  const yes = confirm("Are you sure you want to delete this task?");
  if (yes) {
    await deleteTask({ id: taskId.value });
    router.push(`/boards/${boardID.value}`);
    alerts.success("Task successfully deleted!");
  }
}

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
                height: '200px'
              }"
              class="mb-5"
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
          <pre class="max-w-lg">
            {{ boardOrder }}</pre>
          
          
        </main>
        <aside
          class="pl-5 sm:w-[300px] border-t-gray-300 border-t-2 sm:border-t-0"
        >
          <ul class="m-auto">
            <li>
            <strong>Task Image</strong>
            <AppImageDropzone
              class="aspect-video w-56"
              :image="taskCopy.image?.downloadUrl"
              :loading="imageLoading"
              @deleteImage="removeImageTask({
                  id: taskCopy?.image?.id
                })"
              @upload="
                attachImageTask({
                  id: taskId,
                  imageId: $event.id,
                })"
              
            />
          </li>
            <li class="my-3">
              <strong class="text-xs mb-2 block">Task Labels</strong>
              <AppLabelsPicker
                :selectId="taskId"
                :selected="TaskLabels"
                
              />
            </li>
            <li class="my-3">
              <strong class="text-xs mb-2 block" for="calendar"
                >Task Due Date</strong
              >
              <KCalendar :defaultValue="dateObject" v-model="dateObject" />
            </li>
            <li class="my-3">
               <KButton @click="handleDeleteTask()" theme-color="danger"
                >Delete Task</KButton>
              </li>
          </ul>
        </aside>
      </div>
      <KDialogActionsBar>
        <KButton @click="$router.push(`/boards/${$route.params.id}`)"
          >Cancel</KButton
        >
        <KButton theme-color="primary" @click="updateTaskOnClick(taskCopy?.title, taskCopy?.description, dateObject)">Save Task</KButton>
      </KDialogActionsBar>
    </KDialog>
  </div>
</template>