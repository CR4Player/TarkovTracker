import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMetadataStore } from '@/stores/useMetadata';
import { useTarkovStore } from '@/stores/useTarkov';
import type { Task, TaskObjective } from '@/types/tarkov';
export type TaskActionPayload = {
  taskId: string;
  taskName: string;
  action: 'available' | 'complete' | 'uncomplete';
  undoKey?: string;
  statusKey?: string;
};
export type UseTaskActionsReturn = {
  markTaskComplete: (isUndo?: boolean) => void;
  markTaskUncomplete: (isUndo?: boolean) => void;
  markTaskAvailable: () => void;
};
export function useTaskActions(
  task: () => Task,
  onAction?: (payload: TaskActionPayload) => void
): UseTaskActionsReturn {
  const { t } = useI18n({ useScope: 'global' });
  const tarkovStore = useTarkovStore();
  const metadataStore = useMetadataStore();
  const tasks = computed(() => metadataStore.tasks);
  // Create O(1) lookup map for tasks (more efficient than O(n) find operations)
  const tasksMap = computed(() => {
    const map = new Map<string, Task>();
    tasks.value.forEach((taskItem) => {
      map.set(taskItem.id, taskItem);
    });
    return map;
  });
  const handleTaskObjectives = (
    objectives: TaskObjective[],
    action: 'setTaskObjectiveComplete' | 'setTaskObjectiveUncomplete'
  ) => {
    objectives.forEach((objective) => {
      if (!objective?.id) return;
      if (action === 'setTaskObjectiveComplete') {
        tarkovStore.setTaskObjectiveComplete(objective.id);
        if (objective.count !== undefined && objective.count > 0) {
          tarkovStore.setObjectiveCount(objective.id, objective.count);
        }
        return;
      }
      tarkovStore.setTaskObjectiveUncomplete(objective.id);
    });
  };
  const handleAlternatives = (
    alternatives: string[] | undefined,
    taskAction: 'setTaskFailed' | 'setTaskUncompleted',
    objectiveAction: 'setTaskObjectiveComplete' | 'setTaskObjectiveUncomplete'
  ) => {
    if (!Array.isArray(alternatives)) return;
    alternatives.forEach((alternativeTaskId) => {
      tarkovStore[taskAction](alternativeTaskId);
      const alternativeTask = tasksMap.value.get(alternativeTaskId);
      if (alternativeTask?.objectives) {
        handleTaskObjectives(alternativeTask.objectives, objectiveAction);
      }
    });
  };
  const ensureMinLevel = () => {
    const minLevel = task().minPlayerLevel ?? 0;
    // Note: playerLevel is a getter that returns a function, so it must be called with ()
    if (tarkovStore.playerLevel() < minLevel) {
      tarkovStore.setLevel(minLevel);
    }
  };
  const emitAction = (payload: TaskActionPayload) => {
    onAction?.(payload);
  };
  const markTaskComplete = (isUndo = false) => {
    const currentTask = task();
    const taskName = currentTask.name ?? t('page.tasks.questcard.task', 'Task');
    if (!isUndo) {
      emitAction({
        taskId: currentTask.id,
        taskName,
        action: 'complete',
        statusKey: 'page.tasks.questcard.statuscomplete',
      });
    }
    tarkovStore.setTaskComplete(currentTask.id);
    if (currentTask.objectives) {
      handleTaskObjectives(currentTask.objectives, 'setTaskObjectiveComplete');
    }
    handleAlternatives(currentTask.alternatives, 'setTaskFailed', 'setTaskObjectiveComplete');
    ensureMinLevel();
    if (isUndo) {
      emitAction({
        taskId: currentTask.id,
        taskName,
        action: 'complete',
        undoKey: 'page.tasks.questcard.undocomplete',
      });
    }
  };
  const markTaskUncomplete = (isUndo = false) => {
    const currentTask = task();
    const taskName = currentTask.name ?? t('page.tasks.questcard.task', 'Task');
    if (!isUndo) {
      emitAction({
        taskId: currentTask.id,
        taskName,
        action: 'uncomplete',
        statusKey: 'page.tasks.questcard.statusuncomplete',
      });
    }
    tarkovStore.setTaskUncompleted(currentTask.id);
    if (currentTask.objectives) {
      handleTaskObjectives(currentTask.objectives, 'setTaskObjectiveUncomplete');
    }
    handleAlternatives(
      currentTask.alternatives,
      'setTaskUncompleted',
      'setTaskObjectiveUncomplete'
    );
    if (isUndo) {
      emitAction({
        taskId: currentTask.id,
        taskName,
        action: 'uncomplete',
        undoKey: 'page.tasks.questcard.undouncomplete',
      });
    }
  };
  const markTaskAvailable = () => {
    const currentTask = task();
    const taskName = currentTask.name ?? t('page.tasks.questcard.task', 'Task');
    currentTask.taskRequirements?.forEach((req) => {
      if (req.task?.id) {
        tarkovStore.setTaskComplete(req.task.id);
        const reqTask = tasksMap.value.get(req.task.id);
        if (reqTask?.objectives) {
          handleTaskObjectives(reqTask.objectives, 'setTaskObjectiveComplete');
        }
        if (reqTask?.alternatives) {
          handleAlternatives(reqTask.alternatives, 'setTaskFailed', 'setTaskObjectiveComplete');
        }
      }
    });
    currentTask.predecessors?.forEach((predecessorId) => {
      tarkovStore.setTaskComplete(predecessorId);
      const predecessorTask = tasksMap.value.get(predecessorId);
      if (predecessorTask?.objectives) {
        handleTaskObjectives(predecessorTask.objectives, 'setTaskObjectiveComplete');
      }
      if (predecessorTask?.alternatives) {
        handleAlternatives(
          predecessorTask.alternatives,
          'setTaskFailed',
          'setTaskObjectiveComplete'
        );
      }
    });
    ensureMinLevel();
    emitAction({
      taskId: currentTask.id,
      taskName,
      action: 'available',
      statusKey: 'page.tasks.questcard.statusavailable',
    });
  };
  return {
    markTaskComplete,
    markTaskUncomplete,
    markTaskAvailable,
  };
}
