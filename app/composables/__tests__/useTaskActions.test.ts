import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { Task } from '@/types/tarkov';
const createTarkovStore = (options: {
  playerLevel?: number;
  objectiveCounts?: Record<string, number>;
}) => {
  const objectiveCounts = new Map<string, number>(Object.entries(options.objectiveCounts ?? {}));
  return {
    setTaskComplete: vi.fn(),
    setTaskFailed: vi.fn(),
    setTaskUncompleted: vi.fn(),
    setTaskObjectiveComplete: vi.fn(),
    setTaskObjectiveUncomplete: vi.fn(),
    setObjectiveCount: vi.fn((objectiveId: string, count: number) => {
      objectiveCounts.set(objectiveId, count);
    }),
    getObjectiveCount: vi.fn((objectiveId: string) => objectiveCounts.get(objectiveId) ?? 0),
    playerLevel: vi.fn(() => options.playerLevel ?? 1),
    setLevel: vi.fn(),
    isTaskFailed: vi.fn(() => false),
  };
};
const createMetadataStore = (tasks: Task[]) => ({
  tasks,
});
const setup = async (
  task: Task,
  tasks: Task[],
  options: Parameters<typeof createTarkovStore>[0]
) => {
  const onAction = vi.fn();
  const tarkovStore = createTarkovStore(options);
  const metadataStore = createMetadataStore(tasks);
  vi.resetModules();
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: () => tarkovStore,
  }));
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => metadataStore,
  }));
  vi.doMock('vue-i18n', () => ({
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }));
  const { useTaskActions } = await import('@/composables/useTaskActions');
  const taskRef = ref(task);
  const actions = useTaskActions(() => taskRef.value, onAction);
  return {
    actions,
    onAction,
    taskRef,
    tarkovStore,
  };
};
describe('useTaskActions', () => {
  it('marks a task complete and handles alternatives', async () => {
    const task: Task = {
      id: 'task-main',
      name: 'Main Task',
      minPlayerLevel: 5,
      objectives: [{ id: 'obj-main', count: 2 }],
      alternatives: ['task-alt'],
    };
    const alternative: Task = {
      id: 'task-alt',
      name: 'Alt Task',
      objectives: [{ id: 'obj-alt', count: 1 }],
    };
    const { actions, onAction, tarkovStore } = await setup(task, [task, alternative], {
      playerLevel: 2,
      objectiveCounts: { 'obj-alt': 1 },
    });
    actions.markTaskComplete();
    expect(tarkovStore.setTaskComplete).toHaveBeenCalledWith('task-main');
    expect(tarkovStore.setTaskObjectiveComplete).toHaveBeenCalledWith('obj-main');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-main', 2);
    expect(tarkovStore.setTaskFailed).toHaveBeenCalledWith('task-alt');
    expect(tarkovStore.setTaskObjectiveUncomplete).toHaveBeenCalledWith('obj-alt');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-alt', 0);
    expect(tarkovStore.setLevel).toHaveBeenCalledWith(5);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'complete', taskId: 'task-main' })
    );
  });
  it('marks a task available and processes requirements', async () => {
    const requirementTask: Task = {
      id: 'task-req',
      name: 'Requirement',
      objectives: [{ id: 'obj-req', count: 1 }],
    };
    const predecessorTask: Task = {
      id: 'task-pre',
      name: 'Predecessor',
      objectives: [{ id: 'obj-pre', count: 1 }],
    };
    const task: Task = {
      id: 'task-main',
      name: 'Main Task',
      minPlayerLevel: 3,
      taskRequirements: [
        {
          task: { id: 'task-req' },
          status: ['Failed'],
        },
      ],
      predecessors: ['task-pre'],
    };
    const { actions, onAction, tarkovStore } = await setup(
      task,
      [task, requirementTask, predecessorTask],
      {
        playerLevel: 1,
        objectiveCounts: { 'obj-req': 1 },
      }
    );
    actions.markTaskAvailable();
    expect(tarkovStore.setTaskFailed).toHaveBeenCalledWith('task-req');
    expect(tarkovStore.setTaskObjectiveUncomplete).toHaveBeenCalledWith('obj-req');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-req', 0);
    expect(tarkovStore.setTaskComplete).toHaveBeenCalledWith('task-pre');
    expect(tarkovStore.setTaskObjectiveComplete).toHaveBeenCalledWith('obj-pre');
    expect(tarkovStore.setObjectiveCount).toHaveBeenCalledWith('obj-pre', 1);
    expect(tarkovStore.setLevel).toHaveBeenCalledWith(3);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'available', taskId: 'task-main' })
    );
  });
});
