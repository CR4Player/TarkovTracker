# Plan: Improve Objectives Layout

## Problem Statement

The user identified two issues with the "Objectives" section in task cards:

1. **Objectives take up the full width** - looks weird on wide devices
2. **Counters are on the far right** - too far from the objective text

## Root Cause Analysis

### Current Implementation in [`TaskObjective.vue`](../app/features/tasks/TaskObjective.vue:2-3)

```vue
<div class="group gap-2... grid cursor-pointer grid-cols-[16px_1fr_auto] items-start">
  <!-- Column 1: Icon (16px fixed) -->
  <!-- Column 2: Text (1fr - expands to fill ALL available space) -->
  <!-- Column 3: Controls (auto - pushed to far right) -->
</div>
```

The `1fr` column causes the text to expand and fill all available horizontal space, pushing the controls to the far right edge of the container.

### Visual Representation

**Current (problematic):**

```
|[icon] Objective text here...[controls]|
|<-------------------------- full card width -------------------------->|
```

**Desired:**

```
|[icon] Objective text here... [controls]                |
|<-- content width -->|
```

---

## Solution

### Change 1: Modify [`TaskObjective.vue`](../app/features/tasks/TaskObjective.vue)

Change from a 3-column grid to a flexbox layout where controls appear inline after the text.

**Before (lines 2-8):**

```vue
<div
  class="group grid cursor-pointer grid-cols-[16px_1fr_auto] items-start gap-2 rounded-md px-2 py-2 transition-colors"
  :class="isComplete ? 'bg-success-500/10' : 'hover:bg-white/5'"
  @click="handleRowClick"@mouseenter="objectiveMouseEnter()"
  @mouseleave="objectiveMouseLeave()"
><UIcon ... />
  <div class="min-w-0">
    <!-- text content -->
  </div>
  <div class="flex items-center gap-2" @click.stop>
    <!-- controls -->
  </div>
</div>
```

**After:**

```vue
<div
  class="group flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 transition-colors"
  :class="isComplete ? 'bg-success-500/10' : 'hover:bg-white/5'"
  @click="handleRowClick"
  @mouseenter="objectiveMouseEnter()"
  @mouseleave="objectiveMouseLeave()"
>
  <UIcon
    :name="objectiveIcon.startsWith('mdi-') ? `i-${objectiveIcon}` : objectiveIcon"
    class="mt-0.5 h-4 w-4 shrink-0":class="isComplete ? 'text-success-300' : 'text-gray-400group-hover:text-gray-300'"
  />
  <div class="flex min-w-0 flex-wrap items-center gap-x-3gap-y-1">
    <div class="text-sm leading-5 text-gray-100">
      {{ props.objective?.description }}
    </div>
    <div
      v-if="userHasTeam && activeUserView === 'all' && userNeeds.length > 0"
      class="inline-flex items-center gap-1 text-[11px] text-gray-500"
      :title="userNeedsTitle"
    >
      <UIcon name="i-mdi-account-multiple-outline" class="h-3.5 w-3.5" />
      <span>{{ userNeeds.length }}</span>
    </div>
    <div class="flex shrink-0 items-center gap-2" @click.stop>
      <ObjectiveCountControls
        v-if="neededCount > 1"
        :current-count="currentObjectiveCount"
        :needed-count="neededCount"
        @decrease="decreaseCount"
        @increase="increaseCount"
        @toggle="toggleCount"
      />
      <button
        v-else
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
        :class="
          isComplete
            ? 'bg-success-600 border-success-500 hover:bg-success-500 text-white'
            : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
        "
        :title="
          isComplete
            ? t('page.tasks.questcard.uncomplete', 'Uncomplete')
            : t('page.tasks.questcard.complete', 'Complete')
        "
        @click="toggleObjectiveCompletion()"
      >
        <UIcon :name="isComplete ? 'i-mdi-check' : 'i-mdi-circle-outline'" class="h-4 w-4" />
      </button>
    </div>
  </div>
</div>
```

**Key changes:**

- Changed outer container from `grid grid-cols-[16px_1fr_auto]` to `flex`
- Moved controls inside the text container using `flex flex-wrap`
- Controls now appear inline after the text, wrapping to next line on narrow screens
- Removed `line-clamp-2` to allow text to flow naturally with controls

---

### Change 2: Modify [`QuestObjectives.vue`](../app/features/tasks/QuestObjectives.vue)

Add a max-width constraint to prevent objectives from stretching too wide on large screens.

**Before (line 2):**

```vue
<div class="flex flex-col divide-y divide-white/5">
```

**After:**

```vue
<div class="flex max-w-2xl flex-col divide-y divide-white/5">
```

This limits the objectives container to `max-w-2xl` (672px), which provides a comfortable reading width while still allowing flexibility on smaller screens.

---

## Alternative Approaches Considered

### Option A: Keep Grid, Add Max-Width (Simpler)

Just add `max-w-2xl` to the container without changing the grid layout. This would constrain width but still have controls at the far right of the constrained area.

**Pros:** Minimal changes
**Cons:** Controls still separated from text within the constrained width

### Option B: Flexbox with Inline Controls (Recommended)

Change to flexbox so controls appear immediately after text.

**Pros:** Controls are visually connected to their objective text
**Cons:** Slightly more complex layout changes

### Option C: Two-Row Layout

Put controls on a second row below the text.

**Pros:** Clean separation
**Cons:** Takes more vertical space, less intuitive

**Decision:** Option B is recommended as it best addresses both user concerns.

---

## Implementation Checklist

- [x] Update [`TaskObjective.vue`](../app/features/tasks/TaskObjective.vue) template (lines 1-55)
- [x] Update [`QuestObjectives.vue`](../app/features/tasks/QuestObjectives.vue) container class (line 2)
- [ ] Test on narrow screens (mobile)
- [ ] Test on wide screens (desktop)
- [ ] Verify hover states still work correctly
- [ ] Verify click handlers still work correctly

---

## Follow-up Fix: Full-Width Background

### Issue

After the initial implementation, the background color for hover/active states appeared as a rounded "pill" that only wrapped the text and controls, rather than filling the entire row width.

### Root Cause

The outer container div in `TaskObjective.vue` used `flex` layout but lacked `w-full`, causing it to shrink to content width.

### Fix Applied

Added `w-full` to the outer container class in [`TaskObjective.vue`](../app/features/tasks/TaskObjective.vue:3):

```vue
class="group flex w-full cursor-pointer items-start gap-4 rounded-md px-2 py-2 transition-colors"
```

This ensures the background fills the full row width (constrained by parent's `max-w-2xl`) while maintaining the "controls follow text" behavior.

---

## Visual Mockup

### Before (Wide Screen)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [✓] Kill10 Scavs on Customs[5/10] │
│ [○] Find thedocument                                              [✓] │
│ [○] Hand over3Salewa first aid kits                          [0/3]  │
└─────────────────────────────────────────────────────────────────────────┘
```

### After (Wide Screen)

```
┌─────────────────────────────────────────┐
│ [✓] Kill 10 Scavs on Customs [5/10]                                    │
│ [○] Find the document [✓]                                              │
│ [○] Hand over 3 Salewa first aid kits [0/3]│
└─────────────────────────────────────────────────────────────────────────┘
```

### After (Narrow Screen - Controls Wrap)

```
┌─────────────────────────────┐
│ [✓] Kill 10 Scavs on        │
│     Customs [5/10]          │
│ [○] Find the document [✓]   │
│ [○] Hand over 3 Salewa      │
│     first aid kits [0/3]    │
└─────────────────────────────┘
```
