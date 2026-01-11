import { describe, expect, it, vi } from 'vitest';
import type { Task, TaskObjective, Trader } from '@/types/tarkov';
const createTasks = (): Task[] => [
  {
    id: 'task-a',
    name: 'Task A',
    kappaRequired: true,
    factionName: 'Any',
    trader: { id: 'trader-1', name: 'Trader One' },
    objectives: [{ id: 'obj-a', taskId: 'task-a' }],
  },
  {
    id: 'task-b',
    name: 'Task B',
    lightkeeperRequired: true,
    factionName: 'Any',
    trader: { id: 'trader-1', name: 'Trader One' },
    objectives: [{ id: 'obj-b', taskId: 'task-b' }],
  },
  {
    id: 'task-c',
    name: 'Task C',
    factionName: 'Any',
    trader: { id: 'trader-2', name: 'Trader Two' },
    objectives: [{ id: 'obj-c', taskId: 'task-c' }],
  },
  {
    id: 'task-d',
    name: 'Task D',
    factionName: 'Any',
    trader: { id: 'trader-2', name: 'Trader Two' },
    objectives: [{ id: 'obj-d', taskId: 'task-d' }],
  },
];
const createObjectives = (): TaskObjective[] => [
  {
    id: 'obj-a',
    taskId: 'task-a',
    type: 'giveItem',
    count: 1,
    item: { id: 'item-a', name: 'Item A' },
  },
  {
    id: 'obj-b',
    taskId: 'task-b',
    type: 'giveItem',
    count: 2,
    item: { id: 'item-b', name: 'Item B' },
  },
];
const createMetadataStore = (tasks: Task[]) => {
  const traders: Trader[] = [
    { id: 'trader-1', name: 'Trader One' },
    { id: 'trader-2', name: 'Trader Two' },
  ];
  return {
    tasks,
    objectives: createObjectives(),
    traders,
    sortedTraders: traders,
    editions: [],
  };
};
const createProgressStore = () => ({
  invalidTasks: {
    'task-d': { self: true },
  },
  objectiveCompletions: {
    'obj-a': { self: true },
    'obj-b': { self: false },
  },
});
const createTarkovStore = () => {
  const completedTasks = new Set(['task-a', 'task-c']);
  const failedTasks = new Set(['task-b']);
  const completedObjectives = new Set(['obj-a']);
  return {
    isTaskComplete: (taskId: string) => completedTasks.has(taskId),
    isTaskFailed: (taskId: string) => failedTasks.has(taskId),
    isTaskObjectiveComplete: (objectiveId: string) => completedObjectives.has(objectiveId),
    getPMCFaction: () => 'USEC',
    getGameEdition: () => 1,
    getObjectiveCount: () => 0,
  };
};
const setup = async () => {
  const tasks = createTasks();
  const metadataStore = createMetadataStore(tasks);
  const progressStore = createProgressStore();
  const tarkovStore = createTarkovStore();
  vi.resetModules();
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => metadataStore,
  }));
  vi.doMock('@/stores/useProgress', () => ({
    useProgressStore: () => progressStore,
  }));
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: () => tarkovStore,
  }));
  const { useDashboardStats } = await import('@/composables/useDashboardStats');
  return {
    dashboardStats: useDashboardStats(),
  };
};
describe('useDashboardStats', () => {
  it('calculates task totals and failures correctly', async () => {
    const { dashboardStats } = await setup();
    expect(dashboardStats.totalTasks.value).toBe(2);
    expect(dashboardStats.completedTasks.value).toBe(2);
    expect(dashboardStats.failedTasksCount.value).toBe(1);
  });
  it('calculates kappa and lightkeeper stats', async () => {
    const { dashboardStats } = await setup();
    expect(dashboardStats.totalKappaTasks.value).toBe(1);
    expect(dashboardStats.completedKappaTasks.value).toBe(1);
    expect(dashboardStats.totalLightkeeperTasks.value).toBe(0);
    expect(dashboardStats.completedLightkeeperTasks.value).toBe(0);
  });
  it('builds trader stats excluding invalid and failed tasks', async () => {
    const { dashboardStats } = await setup();
    expect(dashboardStats.traderStats.value).toEqual([
      {
        id: 'trader-1',
        name: 'Trader One',
        imageLink: undefined,
        totalTasks: 1,
        completedTasks: 1,
        percentage: '100.0',
      },
      {
        id: 'trader-2',
        name: 'Trader Two',
        imageLink: undefined,
        totalTasks: 1,
        completedTasks: 1,
        percentage: '100.0',
      },
    ]);
  });
});
