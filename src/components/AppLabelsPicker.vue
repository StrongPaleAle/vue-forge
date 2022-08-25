<script setup lang="ts">
import { ref, toRef, watch, computed } from "vue";
import { Input as KInput } from "@progress/kendo-vue-inputs";
import { Button as KButton } from "@progress/kendo-vue-buttons";
import type { Label } from "@/types";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { useAlerts } from "@/stores/alerts";
import labelsQuery from "@/graphql/queries/labels.query.gql";
import labelCreateMutation from "@/graphql/mutations/createLabel.mutation.gql";
import deleteLabelMutation from "@/graphql/mutations/deleteLabel.mutation.gql";
import updateLabelMutation from "@/graphql/mutations/updateLabel.mutation.gql";
import TaskQuery from "@/graphql/queries/task.query.gql";
import connectLabelMutation from "@/graphql/mutations/connectLabel.mutation.gql";
import disconnectLabelMutation from "@/graphql/mutations/disconnectLabel.mutation.gql";
const alerts = useAlerts();
type L = Partial<Label>;
// props
const props = defineProps<{
  selectId: string;
  selected: L[];
}>();


// emits
const emit = defineEmits<{
  (e: "select", payload: L): void;
  (e: "deselect", payload: L): void;
  (e: "create", payload: L): void;
  (e: "delete", payload: L): void;
  (e: "labelsUpdate", payload: L[]): void;
  (e: "selectionUpdate", payload: L[]): void;
}>();
// local data
const labelsCopy = ref<Partial<Label>[]>([]);
const toDelete = ref<Partial<Label>>();
const selectId  = ref(props.selectId);
const selected = ref<L[]>(props.selected);
const showCreate = ref(false);
const newLabel = ref<L>({
  label: "",
  color: "red",
});

// LABELS QUERY§

const { 
  result: labelsData,
  loading: loadingLabels,
  onError: onLabelsError, 
  onResult: onLabelsLoad 
  } = useQuery(
    labelsQuery,
    {
      fetchPolicy: "cache-and-network",
    });


onLabelsLoad(() => {
  //console.log(labelsData.value);
  labelsCopy.value = labelsData?.value?.labelsList?.items;
  
  
});

onLabelsError(() => alerts.error("Error loading labels"));

const labels = computed(() => labelsData.value?.labelsList?.items || null);
// functions
function clone(object: Record<string, any>) {
  return JSON.parse(JSON.stringify(object));
}

const {mutate: updateLabel, onDone: onLabelUpdated, onError: onErrorUpdateLabel} = useMutation(
  updateLabelMutation
);
onLabelUpdated(() => {
  alerts.success("Label updated");
  
} );

onErrorUpdateLabel((error) => {
  console.error(error.message)
  alerts.error("Error updating label")
  });

function handleUpdate(labelText: string, id: string) {
  console.log(labelText, id);
  updateLabel({ id: id, label: labelText});
  emit("labelsUpdate", clone(labels.value));
}
//handle delete board
const { mutate: deleteLabel, onError: onErrorDeletingLabel, onDone: onLabelDeleted } = useMutation(
  deleteLabelMutation,{
    update(cache) {
      cache.updateQuery({ query: labelsQuery }, (res) => ({
        labelsList: {
          items: res.labelsList?.items.filter(
            (item: L) => item.id !== toDelete?.value?.id
          ),
        },
      }));
    }
  }
);
onErrorDeletingLabel(() => alerts.error("Error deleting label!"));
onLabelDeleted(() => alerts.success("Label deleted!"));

async function handleDelete(todeletelabel: L) {
  toDelete.value = todeletelabel;
  const yes = confirm("Are you sure you want to delete this label?");
  if (yes) {
    await deleteLabel({ id: todeletelabel.id });
    emit("delete", clone(todeletelabel));
  }
}

// ADD LABEL MUTATION

const { mutate: addLabel,  onDone: onLabelAdded, onError: onErrorAddLabel  } = useMutation(labelCreateMutation, () => ({
  update(cache, { data: { labelCreate } }) {
    cache.updateQuery({ query: labelsQuery }, (res) => ({
      labelsList: {
        items: [...res.labelsList.items, labelCreate],
      },
    }));
  },
}));

onLabelAdded(() => {
  alerts.success("Label successfully added!");
  
  });

function handleCreate() {
  const label = { ...newLabel.value};
  addLabel({label: label.label, color: label.color});
  emit("create", clone(label));
  showCreate.value = false;
  resetNewLabel();
}
onErrorAddLabel(() => alerts.error("Error adding label"));

const { mutate: connectLabel, onDone: onLabelConnected, onError: onErrorConnectLabel } = useMutation(
  connectLabelMutation,
  {
    update(cache, {data}) {
    
      cache.updateQuery({ query: TaskQuery,
      variables: {
        id: selectId.value,
      } }, 
      (res) => ({
        task: {
          ...res.task,
          labels:{
            items: [...res.task.labels.items, data.labelUpdate]
          }
        }
      }));
    }
  }
);
const { mutate: disconnectLabel, onDone: onLabelDisconnected, onError: onErrorDisconnectLabel } = useMutation(
  disconnectLabelMutation,
  {
    update(cache, {data}) {
      cache.updateQuery({ query: TaskQuery,
      variables: {
        id: selectId.value,
      } }, 
      (res) => ({
        task: {
          ...res.task,
          labels:{
            items: res.task.labels.items.filter(
              (item: L) => item.id !== data.labelUpdate.id
            )
          }
        }
      }));
    }
  }
);
onLabelConnected(() => {
  alerts.success("Label successfully updated!");
}
);
onLabelDisconnected(() => {
  alerts.success("Label successfully updated!");
}
);
onErrorConnectLabel((error) => {
  console.error(error.message);
  alerts.error("Error updating label")
  });
onErrorDisconnectLabel((error) => {
  console.error(error.message);
  alerts.error("Error updating label")
  });


async function handleToggle(label: L) {
  if (selected?.value.map((s) => s.id).includes(label.id)) {
    console.log("disconnect " + label.id + " from " + selectId.value);
    await disconnectLabel({ id: label.id, taskId: selectId.value });
    console.log(label);
    emit("deselect", label);
  } else {
    console.log("connect " + label.id + " from " + selectId.value);
    await connectLabel({ id: label.id, taskId: selectId.value });
    console.log(label);
    emit("select", label);
  }
}

function resetNewLabel() {
  newLabel.value.label = "";
  newLabel.value.color = "red";
}

watch(
  () => props.selected,
  () => {
    selected.value = props.selected;
  }
);
</script>
<template>
  <div v-if="!loadingLabels">
    <!--make sure tailwind CSS colors are on safelist for this-->
    <button
      v-for="(label, index) in labels"
      :key="label.id || label.label"
      :class="`bg-${label.color}-500 p-2 rounded text-white my-1 flex justify-between`"
    >
      <div class="flex items-center">
        <span
          @click.prevent="handleToggle(label)"
          class="w-4 h-4 mr-2"
          :class="
            selected?.map((s) => s.id).includes(label.id)
              ? `k-icon k-i-check`
              : ''
          "
        ></span>
        <input
          class="w-3/4 bg-transparent ouline-none"
          type="text"
          :value="label.label"
          @keydown.enter="handleUpdate(($event.target as HTMLInputElement).value, label.id)"
        />
      </div>
      <button
        class="k-icon k-i-trash"
        @click.prevent="handleDelete(label)"
      ></button>
    </button>
    <div>
      <button class="p-2" @click="showCreate = !showCreate">
        + Create Label
      </button>
      <div v-if="showCreate">
        <label class="block">
          Label
          <KInput :style="{ width: '230px' }" v-model="newLabel.label"></KInput>
        </label>
        <label class="block">
          Color
          <AppColorInput v-model="newLabel.color" />
        </label>
        <KButton @click="handleCreate" class="block mt-3" theme-color="primary"
          >Create</KButton
        >
      </div>
    </div>
  </div>
</template>