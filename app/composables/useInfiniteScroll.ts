import {
  type ComputedRef,
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  type Ref,
  ref,
  toValue,
  watch,
} from 'vue';
import { logger } from '@/utils/logger';
export interface UseInfiniteScrollOptions {
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean | Ref<boolean> | ComputedRef<boolean>;
  /** Re-run checks after each load to fill the viewport automatically. */
  autoFill?: boolean;
  /** Attach a window scroll listener as a fallback when needed (opt-in). */
  useScrollFallback?: boolean;
  scrollThrottleMs?: number;
  /** Keep auto-loading while the user is at the bottom, even without new scroll events. */
  stickToBottom?: boolean;
  /** Distance from the bottom (px) to consider "at bottom" when stickToBottom is enabled. */
  stickToBottomThreshold?: number;
  /**
   * If false, skip the initial auto-load checks.
   * When true (default), triggers load checks both on mount and when the sentinel element changes.
   * This ensures the viewport is populated initially and re-checked when the sentinel is replaced.
   */
  autoLoadOnReady?: boolean;
  /**
   * Maximum number of auto-load cycles while the sentinel remains in range.
   * Prevents runaway loops if the list doesn't grow.
   */
  maxAutoLoads?: number;
}
// Scroll fallback attaches a global window scroll listener; only enable if needed.
export function useInfiniteScroll(
  sentinelRef: Ref<HTMLElement | null> | ComputedRef<HTMLElement | null>,
  onLoadMore: () => void | Promise<void>,
  options: UseInfiniteScrollOptions = {}
) {
  const {
    rootMargin = '1500px',
    threshold = 0,
    autoFill = true,
    // When true, attaches a window scroll listener; opt-in for cases without IntersectionObserver.
    useScrollFallback = false,
    scrollThrottleMs = 100,
    stickToBottom = useScrollFallback,
    stickToBottomThreshold = 200,
    autoLoadOnReady = true,
    maxAutoLoads = 100,
  } = options;
  const enabled = computed(() => toValue(options.enabled) ?? true);
  const shouldAttachScrollListener = useScrollFallback || stickToBottom;
  let observer: IntersectionObserver | null = null;
  const isLoading = ref(false);
  const canUseObserver = typeof IntersectionObserver !== 'undefined';
  let warnedObserverUnavailable = false;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  let pendingScroll = false;
  const marginPx = parseInt(rootMargin) || 1500;
  let autoLoadCount = 0;
  let stickToBottomArmed = false;
  let isStuckToBottom = false;
  let ignoreInitialIntersection = !autoLoadOnReady;
  let pendingRafId: number | null = null;
  let pendingNextTick = false;
  const updateStickiness = () => {
    if (!stickToBottom || !stickToBottomArmed || typeof window === 'undefined') return;
    const doc = document.documentElement;
    const distanceFromBottom = doc.scrollHeight - (window.scrollY + window.innerHeight);
    isStuckToBottom = distanceFromBottom <= stickToBottomThreshold;
  };
  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target?.isIntersecting && enabled.value) {
      if (ignoreInitialIntersection) {
        ignoreInitialIntersection = false;
        return;
      }
      autoLoadCount = 0;
      void checkAndLoadMore();
    }
  };
  const checkAndLoadMore = async () => {
    if (!enabled.value || isLoading.value || !sentinelRef.value) return;
    if (typeof window === 'undefined') return;
    const rect = sentinelRef.value.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const shouldLoad = rect.top < viewportHeight + marginPx || (stickToBottom && isStuckToBottom);
    if (shouldLoad) {
      if (autoFill && autoLoadCount >= maxAutoLoads) {
        logger.warn('[useInfiniteScroll] Max auto-load cycles reached, pausing');
        return;
      }
      if (autoFill) {
        autoLoadCount += 1;
      }
      isLoading.value = true;
      try {
        await Promise.resolve(onLoadMore());
      } catch (error) {
        logger.error('[useInfiniteScroll] Failed to load more items:', error);
      } finally {
        isLoading.value = false;
        // Re-check after DOM updates AND browser paint - sentinel may still
        // be visible if user scrolled fast and more content is needed.
        // Guard against multiple queued nextTick/rAF chains during rapid scroll.
        if (autoFill && !pendingNextTick && pendingRafId === null) {
          pendingNextTick = true;
          nextTick(() => {
            pendingNextTick = false;
            if (pendingRafId !== null || !enabled.value || !sentinelRef.value) return;
            pendingRafId = requestAnimationFrame(() => {
              pendingRafId = null;
              if (!enabled.value || !sentinelRef.value) return;
              void checkAndLoadMore();
            });
          });
        }
      }
    } else {
      autoLoadCount = 0;
    }
  };
  const scheduleScrollCheck = () => {
    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;
      void checkAndLoadMore();
      if (pendingScroll) {
        pendingScroll = false;
        scheduleScrollCheck();
      }
    }, scrollThrottleMs);
  };
  const handleScroll = () => {
    if (!enabled.value) return;
    stickToBottomArmed ||= stickToBottom;
    updateStickiness();
    autoLoadCount = 0;
    if (scrollTimeout) {
      pendingScroll = true;
      return;
    }
    scheduleScrollCheck();
  };
  const createObserver = () => {
    if (!canUseObserver) {
      if (!warnedObserverUnavailable) {
        warnedObserverUnavailable = true;
        logger.warn(
          '[useInfiniteScroll] IntersectionObserver unavailable; ' +
            'enable useScrollFallback to scroll.'
        );
      }
      return;
    }
    if (observer) {
      observer.disconnect();
    }
    observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    });
    if (sentinelRef.value) {
      observer.observe(sentinelRef.value);
    }
  };
  const start = () => {
    // When autoLoadOnReady is true, we run a manual checkAndLoadMore() below.
    // Set ignoreInitialIntersection=true to skip duplicate observer triggers,
    // then clear it after the manual check so subsequent intersections work.
    ignoreInitialIntersection = autoLoadOnReady;
    createObserver();
    if (shouldAttachScrollListener) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    nextTick(() => {
      updateStickiness();
      if (autoLoadOnReady) {
        void checkAndLoadMore();
        // Clear the flag after manual check so observer can respond to subsequent intersections
        ignoreInitialIntersection = false;
      }
    });
  };
  const stop = () => {
    observer?.disconnect();
    observer = null;
    if (shouldAttachScrollListener) {
      window.removeEventListener('scroll', handleScroll);
    }
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
      scrollTimeout = null;
    }
    if (pendingRafId !== null) {
      cancelAnimationFrame(pendingRafId);
      pendingRafId = null;
    }
    pendingNextTick = false;
    pendingScroll = false;
    autoLoadCount = 0;
    stickToBottomArmed = false;
    isStuckToBottom = false;
  };
  watch(
    sentinelRef,
    (el, oldEl) => {
      if (el === oldEl || !observer) return;
      observer.disconnect();
      if (el) {
        observer.observe(el);
        if (autoLoadOnReady) {
          nextTick(() => void checkAndLoadMore());
        }
      }
    },
    { flush: 'post' }
  );
  watch(enabled, (newEnabled) => {
    if (newEnabled) {
      start();
    } else {
      stop();
    }
  });
  onMounted(() => {
    if (enabled.value) {
      start();
    }
  });
  onUnmounted(() => {
    stop();
  });
  return {
    isLoading,
    stop,
    start,
    checkAndLoadMore,
  };
}
