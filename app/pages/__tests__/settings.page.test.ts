import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
const setup = async () => {
  vi.resetModules();
  mockNuxtImport('useNuxtApp', () => () => ({
    $supabase: {
      user: {
        loggedIn: false,
        displayName: 'User',
        photoURL: '',
      },
    },
    deferHydration: () => () => {},
    isHydrating: false,
    runWithContext: (fn: () => unknown) => fn(),
    hooks: {
      hookOnce: vi.fn(),
      callHookWith: vi.fn(() => Promise.resolve()),
      callHook: vi.fn(() => Promise.resolve()),
    },
  }));
  mockNuxtImport('useToast', () => () => ({
    add: vi.fn(),
  }));
  mockNuxtImport('useRouter', () => () => ({
    replace: vi.fn(),
  }));
  mockNuxtImport('useSeoMeta', () => () => {});
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => ({
      editions: [{ value: 1, title: 'Standard' }],
    }),
  }));
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: () => ({
      getStreamerMode: false,
      setStreamerMode: vi.fn(),
    }),
  }));
  vi.doMock('@/stores/useSystemStore', () => ({
    useSystemStore: () => ({
      isAdmin: false,
    }),
    useSystemStoreWithSupabase: () => ({
      hasInitiallyLoaded: ref(true),
    }),
  }));
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: () => ({
      getCurrentGameMode: () => 'pvp',
      getGameEdition: () => 1,
      setGameEdition: vi.fn(),
      getPrestigeLevel: () => 0,
      setPrestigeLevel: vi.fn(),
      resetPvPData: vi.fn(),
      resetPvEData: vi.fn(),
      resetAllData: vi.fn(),
    }),
  }));
  vi.doMock('vue-i18n', () => ({
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }));
  vi.doMock('vue-router', () => ({
    useRouter: () => ({ replace: vi.fn() }),
  }));
  const { default: SettingsPage } = await import('@/pages/settings.vue');
  return SettingsPage;
};
describe('settings page', () => {
  it('renders settings layout', async () => {
    const SettingsPage = await setup();
    const wrapper = await mountSuspended(SettingsPage, {
      global: {
        stubs: {
          AccountDeletionCard: true,
          ApiTokens: true,
          DisplayNameCard: true,
          ExperienceCard: true,
          GenericCard: {
            template: '<div data-testid="generic-card"><slot /><slot name="content" /></div>',
          },
          ImportConfirmDialog: true,
          MigrationSteps: true,
          SkillsCard: true,
          UAlert: true,
          UBadge: true,
          UButton: true,
          UCheckbox: true,
          UIcon: true,
          UInput: true,
          UModal: true,
          USelectMenu: true,
        },
      },
    });
    expect(wrapper.find('[data-testid="generic-card"]').exists()).toBe(true);
  });
});
