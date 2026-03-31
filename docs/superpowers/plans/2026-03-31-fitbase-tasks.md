# FitBase Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver four tasks — a schedule-update bug fix, a full-stack waitlist feature, a ClassOverview refactor, and an AI enrollment-insights panel — with zero regression on existing behavior.

**Architecture:** Tasks 1, 3, 4 are self-contained. Task 2 (waitlist) is the largest and is decomposed into independent backend and frontend subtasks; its schema/counter changes land first so later subtasks can depend on them. Task 3 and Task 4 both depend on Task 2 having run (Task 3 needs `waitlistCount`; Task 4 sends waitlist data to the AI endpoint).

**Tech Stack:** Nuxt 3 / Vue 3 / Pinia (frontend), Koa 3 / Mongoose / MongoDB (backend), Vercel AI SDK + Anthropic Claude Haiku (AI), Element Plus + `@attendu/design-system` + Tailwind CSS 4 (UI), Vitest (unit tests).

---

## File Structure

### Created
- `components/ai/AiEnrollmentInsights.vue` — streaming AI insights panel for the members page

### Modified
| File | What changes |
|------|-------------|
| `stores/class.js` | Fix `updateSchedule` to splice returned session into local state |
| `api/routes/class/_class.schema.js` | Add `waitlistCount` field |
| `api/routes/class/_class.functions.js` | `updateEnrollmentCount` also persists `waitlistCount`; `formatClassForResponse` exposes it |
| `api/routes/member/_member.schema.js` | Update comment; add compound index |
| `api/routes/member/_member.controller.js` | Status filter fix; capacity guards; waitlist promotion; waitlisted stats |
| `api/routes/ai/_ai.controller.js` | Add `enrollmentInsights` method |
| `api/routes/ai/_ai.router.js` | Register new route |
| `api/seed.js` | Persist `waitlistCount` after seeding |
| `stores/members.js` | Add `waitlisted` to stats state; update export map |
| `components/member/MemberStatusBadge.vue` | Handle `status === 2 → waitlisted` |
| `components/class/ClassCard.vue` | Show `waitlistCount` when > 0 |
| `components/class/ClassOverview.vue` | Full refactor: Tailwind, store data, i18n, no console |
| `components/app/AppEnrollButton.vue` | Full-class CTA → active "Join Waitlist" link |
| `pages/classes/[_id]/members.vue` | Add waitlisted filter + stat tile; integrate AI panel |
| `pages/app/[gym]/enroll/[classId].vue` | Differentiate pending vs waitlisted success message |
| `locales/en.json` | Add waitlisted, joinWaitlist, waitlistSuccess, waitlistCount, waitlistOpen, aboutClass, details, recentMembers keys |
| `locales/cs.json` | Same keys in Czech |
| `locales/es.json` | Same keys in Spanish |

---

## Task 1 — Fix Schedule Update Bug

**Files:**
- Modify: `stores/class.js:55-57`

- [ ] **Step 1.1: Understand the bug**

  Open `stores/class.js` and read lines 55–68. Compare `updateSchedule` (lines 55–57) against `addScheduleSession` (lines 59–63) and `removeScheduleSession` (lines 65–68). `updateSchedule` awaits the API call but discards the returned session object — local state is never mutated, so the UI shows stale data until a page reload. The other two actions correctly mutate `this.class.schedule`.

- [ ] **Step 1.2: Apply the fix**

  Replace the `updateSchedule` action:

  ```js
  // stores/class.js — replace lines 55–57
  async updateSchedule(classId, sessionIndex, data) {
    const res = await useApi().put(`/classes/${classId}/schedule/${sessionIndex}`, data)
    this.class.schedule.splice(sessionIndex, 1, res)
    return res
  },
  ```

- [ ] **Step 1.3: Verify manually**

  1. `yarn dev` + `cd api && node index.js`
  2. Login → open any class → Schedule tab
  3. Edit a session (change time or room) → Save
  4. Confirm the updated value appears immediately without page reload

- [ ] **Step 1.4: Commit**

  ```bash
  git add stores/class.js
  git commit -m "fix: update schedule session mutates local store state immediately"
  ```

---

## Task 2a — Waitlist: Backend Schema + Counter Functions

**Files:**
- Modify: `api/routes/class/_class.schema.js`
- Modify: `api/routes/class/_class.functions.js`
- Modify: `api/routes/member/_member.schema.js`

- [ ] **Step 2a.1: Add `waitlistCount` to class schema**

  ```js
  // api/routes/class/_class.schema.js — add after enrollmentCount
  enrollmentCount: { type: Number, default: 0 },
  waitlistCount: { type: Number, default: 0 },
  ```

- [ ] **Step 2a.2: Extend `updateEnrollmentCount` to also persist `waitlistCount`**

  Replace the entire `api/routes/class/_class.functions.js`:

  ```js
  export const updateEnrollmentCount = async (ctx, classId) => {
    const enrollmentCount = await ctx.Member.countDocuments({
      class: classId,
      'status.confirmation': 1,
    })
    const waitlistCount = await ctx.Member.countDocuments({
      class: classId,
      'status.confirmation': 2,
    })
    await ctx.Class.findByIdAndUpdate(classId, { enrollmentCount, waitlistCount })
    return { enrollmentCount, waitlistCount }
  }

  export const formatClassForResponse = (classDoc) => {
    const obj = classDoc.toObject ? classDoc.toObject() : classDoc
    return {
      ...obj,
      isFull: obj.enrollmentCount >= (obj.general?.capacity || Infinity),
      spotsLeft: Math.max(0, (obj.general?.capacity || 0) - (obj.enrollmentCount || 0)),
      waitlistCount: obj.waitlistCount || 0,
    }
  }
  ```

- [ ] **Step 2a.3: Update member schema comment and add compound index**

  ```js
  // api/routes/member/_member.schema.js — update the comment on status.confirmation
  confirmation: { type: Number, default: 0 }, // -1=declined, 0=pending, 1=confirmed, 2=waitlisted
  ```

  After the existing indexes, add:

  ```js
  // api/routes/member/_member.schema.js — add after the existing index lines
  schema.index({ class: 1, 'status.confirmation': 1, enrolledAt: 1 })
  ```

- [ ] **Step 2a.4: Commit**

  ```bash
  git add api/routes/class/_class.schema.js api/routes/class/_class.functions.js api/routes/member/_member.schema.js
  git commit -m "feat(waitlist): add waitlistCount field, update counter function, add compound index"
  ```

---

## Task 2b — Waitlist: Backend Enrollment Logic

**Files:**
- Modify: `api/routes/member/_member.controller.js`

All changes are in this one file. Replace the entire file with the version below.

- [ ] **Step 2b.1: Write the new controller**

  ```js
  // api/routes/member/_member.controller.js
  import { updateEnrollmentCount } from '../class/_class.functions.js'

  // Promotes the oldest waitlisted member to confirmed for a class.
  // Call this BEFORE updateEnrollmentCount so the promotion is reflected in the final counts.
  const promoteFirstWaitlisted = async (ctx, classId) => {
    await ctx.Member.findOneAndUpdate(
      { class: classId, 'status.confirmation': 2 },
      { 'status.confirmation': 1 },
      { sort: { enrolledAt: 1 } },
    )
  }

  class Controller {
    async getMembers(ctx) {
      const find = {}
      if (ctx.params._id) find.class = ctx.params._id
      if (ctx.query.search) {
        find.$or = [
          { 'properties.firstName': { $regex: ctx.query.search, $options: 'i' } },
          { 'properties.lastName': { $regex: ctx.query.search, $options: 'i' } },
          { 'properties.email': { $regex: ctx.query.search, $options: 'i' } },
        ]
      }
      if (ctx.query.status !== undefined) find['status.confirmation'] = parseInt(ctx.query.status)

      const page = parseInt(ctx.query.page) || 1
      const limit = parseInt(ctx.query.limit) || 50
      const skip = (page - 1) * limit
      const sortField = ctx.query.sortField || 'createdAt'
      const sortDirection = ctx.query.sortDirection === 'asc' ? 1 : -1

      const results = await ctx.Member.find(find)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)

      const total = await ctx.Member.countDocuments(find)

      // Stats always count from the full class, not the filtered view
      const classFind = ctx.params._id ? { class: ctx.params._id } : null
      const stats = classFind ? {
        total: await ctx.Member.countDocuments(classFind),
        confirmed: await ctx.Member.countDocuments({ ...classFind, 'status.confirmation': 1 }),
        pending: await ctx.Member.countDocuments({ ...classFind, 'status.confirmation': 0 }),
        declined: await ctx.Member.countDocuments({ ...classFind, 'status.confirmation': -1 }),
        waitlisted: await ctx.Member.countDocuments({ ...classFind, 'status.confirmation': 2 }),
      } : { total }

      ctx.body = { results, total, stats, page, limit }
    }

    async getMember(ctx) {
      const member = await ctx.Member.findById(ctx.params.memberId)
      if (!member) ctx.throw(404, 'Member not found')
      ctx.body = member
    }

    async addMember(ctx) {
      try {
        const classDoc = await ctx.Class.findById(ctx.params._id)
        const body = { ...ctx.request.body }

        // If the class is full, force status to waitlisted (2) for pending/unset/confirmed enrollments
        if (classDoc && classDoc.enrollmentCount >= classDoc.general.capacity) {
          const incomingStatus = body.status?.confirmation
          if (incomingStatus === undefined || incomingStatus === 0 || incomingStatus === 1) {
            body.status = { ...body.status, confirmation: 2 }
          }
        }

        const member = await ctx.Member.create({ class: ctx.params._id, ...body })
        await updateEnrollmentCount(ctx, ctx.params._id)
        ctx.body = member
        ctx.status = 201
      }
      catch (error) {
        ctx.throwError(error)
      }
    }

    async addMembersMany(ctx) {
      const { members } = ctx.request.body
      if (!Array.isArray(members)) ctx.throw(400, 'Members must be an array')

      const classDoc = await ctx.Class.findById(ctx.params._id)
      const isFull = classDoc && classDoc.enrollmentCount >= classDoc.general.capacity

      const results = []
      const errors = []

      for (const memberData of members) {
        try {
          const member = await ctx.Member.create({
            class: ctx.params._id,
            properties: memberData,
            status: { confirmation: isFull ? 2 : 0, addMethod: 'batchImport' },
          })
          results.push(member)
        }
        catch (error) {
          errors.push({ data: memberData, error: error.message })
        }
      }

      await updateEnrollmentCount(ctx, ctx.params._id)
      ctx.body = { results, errors, total: results.length }
    }

    async updateMember(ctx) {
      try {
        const before = await ctx.Member.findById(ctx.params.memberId)
        if (!before) ctx.throw(404, 'Member not found')

        const newConfirmation = ctx.request.body.status?.confirmation

        // Capacity guard: block admin from confirming a member into a full class
        if (newConfirmation === 1 && before.status.confirmation !== 1) {
          const classDoc = await ctx.Class.findById(before.class)
          if (classDoc && classDoc.enrollmentCount >= classDoc.general.capacity) {
            ctx.throw(400, 'Class is full')
          }
        }

        const member = await ctx.Member.findByIdAndUpdate(
          ctx.params.memberId,
          ctx.request.body,
          { new: true, runValidators: true },
        )

        if (newConfirmation !== undefined) {
          // When a confirmed member declines, promote the first waitlisted member
          if (before.status.confirmation === 1 && newConfirmation === -1) {
            await promoteFirstWaitlisted(ctx, member.class)
          }
          await updateEnrollmentCount(ctx, member.class)
        }

        ctx.body = member
      }
      catch (error) {
        ctx.throwError(error)
      }
    }

    async deleteMember(ctx) {
      const member = await ctx.Member.findByIdAndDelete(ctx.params.memberId)
      if (!member) ctx.throw(404, 'Member not found')

      // When a confirmed member is removed, promote the first waitlisted member
      if (member.status.confirmation === 1) {
        await promoteFirstWaitlisted(ctx, member.class)
      }

      await updateEnrollmentCount(ctx, member.class)
      ctx.body = { success: true }
    }

    async exportMembers(ctx) {
      const find = {}
      if (ctx.params._id) find.class = ctx.params._id

      const results = await ctx.Member.find(find).sort({ 'properties.lastName': 1 })
      ctx.body = { results }
    }

    async getAllMembers(ctx) {
      const find = {}
      if (ctx.query.search) {
        find.$or = [
          { 'properties.firstName': { $regex: ctx.query.search, $options: 'i' } },
          { 'properties.lastName': { $regex: ctx.query.search, $options: 'i' } },
          { 'properties.email': { $regex: ctx.query.search, $options: 'i' } },
        ]
      }

      const page = parseInt(ctx.query.page) || 1
      const limit = parseInt(ctx.query.limit) || 50
      const skip = (page - 1) * limit

      const results = await ctx.Member.find(find)
        .populate('class', 'general.title')
        .sort({ 'properties.lastName': 1 })
        .skip(skip)
        .limit(limit)

      const total = await ctx.Member.countDocuments(find)
      ctx.body = { results, total, page, limit }
    }
  }

  export default new Controller()
  ```

- [ ] **Step 2b.2: Verify manually**

  Restart `node api/index.js`. Using the UI or `curl`:
  1. Create a class with capacity 2
  2. Add member A → confirmed (1) → class enrollmentCount = 1
  3. Add member B → confirmed (1) → enrollmentCount = 2 (full)
  4. Add member C → should become waitlisted (2), waitlistCount = 1
  5. Delete member A → member C should auto-promote to confirmed
  6. Verify `enrollmentCount = 2`, `waitlistCount = 0`

- [ ] **Step 2b.3: Commit**

  ```bash
  git add api/routes/member/_member.controller.js
  git commit -m "feat(waitlist): capacity guards, waitlist on full class, auto-promotion on removal/decline"
  ```

---

## Task 2c — Waitlist: Update Seed

**Files:**
- Modify: `api/seed.js`

- [ ] **Step 2c.1: Update enrollment count loop in seed to include `waitlistCount`**

  Find this block in `api/seed.js` (around line 239–244):
  ```js
  // Update enrollment counts
  for (const classDoc of classes) {
    const count = await Member.countDocuments({ class: classDoc._id, 'status.confirmation': 1 })
    await Class.findByIdAndUpdate(classDoc._id, { enrollmentCount: count })
  }
  ```

  Replace it with:
  ```js
  // Update enrollment counts
  for (const classDoc of classes) {
    const enrollmentCount = await Member.countDocuments({ class: classDoc._id, 'status.confirmation': 1 })
    const waitlistCount = await Member.countDocuments({ class: classDoc._id, 'status.confirmation': 2 })
    await Class.findByIdAndUpdate(classDoc._id, { enrollmentCount, waitlistCount })
  }
  ```

- [ ] **Step 2c.2: Re-seed and verify**

  ```bash
  cd api && node seed.js
  ```
  Expected output ends with `Seed complete!`. Then restart `node index.js`.

- [ ] **Step 2c.3: Commit**

  ```bash
  git add api/seed.js
  git commit -m "fix(seed): persist waitlistCount alongside enrollmentCount after seeding"
  ```

---

## Task 2d — Waitlist: i18n Keys

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/cs.json`
- Modify: `locales/es.json`

These keys are needed by both Task 2 (waitlist UI) and Task 3 (ClassOverview refactor).

- [ ] **Step 2d.1: Add keys to `locales/en.json`**

  In the `"member"."status"` object, add after `"declined"`:
  ```json
  "waitlisted": "Waitlisted"
  ```

  In the `"class"` object, add after `"confirmDelete"`:
  ```json
  "waitlistCount": "{count} waitlisted",
  "waitlistOpen": "Waitlist open",
  "aboutClass": "About this class",
  "noDescription": "No description available.",
  "noSchedule": "No schedule set.",
  "details": "Details",
  "recentMembers": "Recent Members"
  ```

  In the `"common"` object, add after `"updatedAt"`:
  ```json
  "notSet": "Not set",
  "tbd": "TBD"
  ```

  In the `"app"` object, add after `"classSchedule"`:
  ```json
  "joinWaitlist": "Join Waitlist",
  "waitlistSuccess": "You're on the waitlist! We'll notify you if a spot opens."
  ```

- [ ] **Step 2d.2: Add keys to `locales/cs.json`**

  In `"member"."status"`, add:
  ```json
  "waitlisted": "Na cekaci listine"
  ```

  In `"class"`, add:
  ```json
  "waitlistCount": "{count} na cekaci listine",
  "waitlistOpen": "Cekaci listina otevrena",
  "aboutClass": "O teto hodine",
  "noDescription": "Popis neni k dispozici.",
  "noSchedule": "Rozvrh neni nastaven.",
  "details": "Detaily",
  "recentMembers": "Nedavni cleni"
  ```

  In `"common"`, add:
  ```json
  "notSet": "Nenastaveno",
  "tbd": "TBD"
  ```

  In `"app"`, add:
  ```json
  "joinWaitlist": "Pridat se na cekaci listinu",
  "waitlistSuccess": "Jste na cekaci listine! Upozornime vas, pokud se uvolni misto."
  ```

- [ ] **Step 2d.3: Add keys to `locales/es.json`**

  Open `locales/es.json` and apply the same structure:

  In `"member"."status"`, add:
  ```json
  "waitlisted": "En lista de espera"
  ```

  In `"class"`, add:
  ```json
  "waitlistCount": "{count} en lista de espera",
  "waitlistOpen": "Lista de espera abierta",
  "aboutClass": "Acerca de esta clase",
  "noDescription": "No hay descripcion disponible.",
  "noSchedule": "No hay horario establecido.",
  "details": "Detalles",
  "recentMembers": "Miembros recientes"
  ```

  In `"common"`, add:
  ```json
  "notSet": "No establecido",
  "tbd": "Por definir"
  ```

  In `"app"`, add:
  ```json
  "joinWaitlist": "Unirse a la lista de espera",
  "waitlistSuccess": "Estas en la lista de espera. Te notificaremos si se abre un lugar."
  ```

- [ ] **Step 2d.4: Verify JSON is valid**

  ```bash
  node -e "require('./locales/en.json'); require('./locales/cs.json'); require('./locales/es.json'); console.log('JSON valid')"
  ```

  Expected: `JSON valid`

- [ ] **Step 2d.5: Commit**

  ```bash
  git add locales/en.json locales/cs.json locales/es.json
  git commit -m "feat(waitlist): add waitlisted, joinWaitlist, waitlistSuccess i18n keys to all locales"
  ```

---

## Task 2e — Waitlist: Frontend — MemberStatusBadge + Members Store

**Files:**
- Modify: `components/member/MemberStatusBadge.vue`
- Modify: `stores/members.js`

- [ ] **Step 2e.1: Add `waitlisted` to `MemberStatusBadge`**

  ```vue
  <!-- components/member/MemberStatusBadge.vue -->
  <template>
    <Badge :text="$t(`member.status.${statusKey}`)" :type="badgeType" />
  </template>

  <script setup>
  const props = defineProps({
    status: { type: Number, required: true },
  })

  const statusKey = computed(() => {
    if (props.status === 1) return 'confirmed'
    if (props.status === 2) return 'waitlisted'
    if (props.status === -1) return 'declined'
    return 'pending'
  })

  const badgeType = computed(() => {
    const map = {
      confirmed: 'success',
      pending: 'warning',
      waitlisted: 'neutral',
      declined: 'critical',
    }
    return map[statusKey.value] || 'neutral'
  })
  </script>
  ```

- [ ] **Step 2e.2: Add `waitlisted` to members store state and export map**

  ```js
  // stores/members.js — update state default for stats
  stats: { total: 0, confirmed: 0, pending: 0, declined: 0, waitlisted: 0 },
  ```

  ```js
  // stores/members.js — update resetMembers action
  resetMembers() {
    this.members = []
    this.total = 0
    this.stats = { total: 0, confirmed: 0, pending: 0, declined: 0, waitlisted: 0 }
    this.page = 1
    this.search = ''
    this.filters = { status: null }
  },
  ```

  ```js
  // stores/members.js — update formatMembersForExport statusMap
  // Also fixes pre-existing bug: fallback was `|| t(...)` where `t` is undefined in this scope
  const statusMap = {
    1: $i18n.t('member.status.confirmed'),
    0: $i18n.t('member.status.pending'),
    2: $i18n.t('member.status.waitlisted'),
    '-1': $i18n.t('member.status.declined'),
  }

  return members.map((m) => ({
    firstName: m.properties.firstName,
    lastName: m.properties.lastName,
    email: m.properties.email,
    phone: m.properties.phone || '',
    status: statusMap[m.status.confirmation] ?? $i18n.t('member.status.pending'),
    enrolledAt: m.enrolledAt,
  }))
  ```

- [ ] **Step 2e.3: Commit**

  ```bash
  git add components/member/MemberStatusBadge.vue stores/members.js
  git commit -m "feat(waitlist): add waitlisted status to badge; add to members store; fix undefined t() in export"
  ```

---

## Task 2f — Waitlist: Frontend — Admin Members Page + ClassCard

**Files:**
- Modify: `pages/classes/[_id]/members.vue`
- Modify: `components/class/ClassCard.vue`

- [ ] **Step 2f.1: Add waitlisted filter and stat tile to members page**

  Replace `pages/classes/[_id]/members.vue` with:

  ```vue
  <template>
    <div class="flex flex-1 flex-col">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <TextInput
            v-model="search"
            :placeholder="$t('common.search')"
            class="w-64"
            @input="onSearch"
          />
          <div class="flex gap-2">
            <Button
              v-for="filter in statusFilters"
              :key="filter.value"
              :type="membersStore.filters.status === filter.value ? 'primary' : 'regular-outline'"
              size="small"
              @click="membersStore.filterMembers(classId, 'status', membersStore.filters.status === filter.value ? null : filter.value)"
            >
              {{ filter.label }}
            </Button>
          </div>
        </div>
        <div class="flex gap-2">
          <Button @click="openImport">
            {{ $t('common.import') }}
          </Button>
          <Button type="primary" @click="openAddMember">
            {{ $t('member.addMember') }}
          </Button>
        </div>
      </div>

      <div class="mb-6 flex flex-wrap gap-4">
        <StatTile v-for="stat in statTiles" :key="stat.label" :value="String(stat.value)" :label="stat.label" />
      </div>

      <MemberList
        :members="membersStore.members"
        :loading="membersStore.isLoading"
        :class-id="classId"
      />
    </div>
  </template>

  <script setup>
  const route = useRoute()
  const t = useT()
  useHead({ title: t('class.members') })
  const membersStore = useMembersStore()
  const dialogStore = useDialogStore()

  const classId = computed(() => route.params._id)
  const search = ref('')

  const statusFilters = computed(() => [
    { value: 1, label: t('member.status.confirmed') },
    { value: 0, label: t('member.status.pending') },
    { value: 2, label: t('member.status.waitlisted') },
    { value: -1, label: t('member.status.declined') },
  ])

  const statTiles = computed(() => [
    { label: t('dashboard.totalMembers'), value: membersStore.stats.total },
    { label: t('member.status.confirmed'), value: membersStore.stats.confirmed },
    { label: t('member.status.pending'), value: membersStore.stats.pending },
    { label: t('member.status.waitlisted'), value: membersStore.stats.waitlisted },
    { label: t('member.status.declined'), value: membersStore.stats.declined },
  ])

  const openImport = () => {
    dialogStore.open({
      component: resolveComponent('MemberImport'),
      props: { classId: classId.value },
      title: t('member.importMembers'),
    })
  }

  const openAddMember = () => {
    dialogStore.open({
      component: resolveComponent('MemberForm'),
      props: { classId: classId.value },
      title: t('member.addMember'),
    })
  }

  const onSearch = useDebounceFn(() => {
    membersStore.setSearch(classId.value, search.value)
  }, 300)

  onMounted(() => {
    membersStore.resetMembers()
    membersStore.fetchMembers(classId.value)
  })
  </script>
  ```

- [ ] **Step 2f.2: Show `waitlistCount` in `ClassCard.vue`**

  In `components/class/ClassCard.vue`, replace the enrollment count span:

  ```vue
  <!-- replace the existing enrollment count span -->
  <span>
    {{ classData.enrollmentCount || 0 }}/{{ classData.general.capacity }}
    {{ $t('class.members').toLowerCase() }}
    <span v-if="classData.waitlistCount" class="ml-1 text-gray-300">
      · {{ $t('class.waitlistCount', { count: classData.waitlistCount }) }}
    </span>
  </span>
  ```

- [ ] **Step 2f.3: Commit**

  ```bash
  git add pages/classes/[_id]/members.vue components/class/ClassCard.vue
  git commit -m "feat(waitlist): add waitlisted filter and stat tile to members page; show waitlistCount in ClassCard"
  ```

---

## Task 2g — Waitlist: Frontend — Public Enrollment Flow

**Files:**
- Modify: `components/app/AppEnrollButton.vue`
- Modify: `pages/app/[gym]/enroll/[classId].vue`

- [ ] **Step 2g.1: Replace disabled div with active "Join Waitlist" link in `AppEnrollButton.vue`**

  ```vue
  <!-- components/app/AppEnrollButton.vue -->
  <template>
    <NuxtLink
      :to="`/app/${gymSlug}/enroll/${classData._id}`"
      class="block w-full rounded-lg px-4 py-3 text-center text-sm font-medium text-white transition-colors"
      :class="classData.isFull
        ? 'bg-gray-500 hover:bg-gray-600'
        : 'bg-primary hover:bg-primary-dark'"
    >
      {{ classData.isFull ? $t('app.joinWaitlist') : $t('app.enrollNow') }}
    </NuxtLink>
  </template>

  <script setup>
  defineProps({
    classData: { type: Object, required: true },
    gymSlug: { type: String, required: true },
  })
  </script>
  ```

- [ ] **Step 2g.2: Differentiate pending vs waitlisted success in enroll page**

  In `pages/app/[gym]/enroll/[classId].vue`, replace the `isSuccess` ref and `onSubmit` handler:

  ```js
  // pages/app/[gym]/enroll/[classId].vue — inside <script setup>
  const isSubmitting = ref(false)
  const isWaitlisted = ref(false)
  const isSuccess = ref(false)

  const onSubmit = async () => {
    isSubmitting.value = true
    try {
      const result = await memberAppStore.enrollPublic(classId.value, form.value)
      isWaitlisted.value = result?.status?.confirmation === 2
      isSuccess.value = true
    }
    catch (error) {
      useToast().error(error?.data?.error || useT()('errors.enrollmentFailed'))
    }
    finally {
      isSubmitting.value = false
    }
  }
  ```

  And update the success div in the template to show the correct message:

  ```vue
  <!-- pages/app/[gym]/enroll/[classId].vue — replace the success div -->
  <div v-if="isSuccess" class="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
    <Icon name="check-circle-broken" class="mx-auto mb-2 h-8 w-8 text-green-600" />
    <p class="text-green-800">
      {{ isWaitlisted ? $t('app.waitlistSuccess') : $t('app.enrollSuccess') }}
    </p>
    <NuxtLink :to="`/app/${gymSlug}`" class="mt-4 inline-block text-primary hover:underline">
      {{ $t('app.browseClasses') }}
    </NuxtLink>
  </div>
  ```

- [ ] **Step 2g.3: Verify manually**

  1. Using the seeded data, find a published class that is full (enrollmentCount = capacity)
  2. Navigate to `/app/default` → click the class
  3. Confirm the CTA says "Join Waitlist" (not a disabled div)
  4. Click it → fill the form → submit
  5. Confirm success message says "You're on the waitlist!" not "You're enrolled!"

- [ ] **Step 2g.4: Commit**

  ```bash
  git add components/app/AppEnrollButton.vue pages/app/[gym]/enroll/[classId].vue
  git commit -m "feat(waitlist): join waitlist CTA on full class; differentiate pending vs waitlisted success message"
  ```

---

## Task 3 — Refactor `ClassOverview.vue`

**Files:**
- Modify: `components/class/ClassOverview.vue`

The parent layout `pages/classes/[_id].vue` already calls `classStore.fetch(classId)` on mount, so `classStore.class` is guaranteed to be loaded when this component renders. The trainer object is already populated by the backend (`getClass` uses `.populate('general.trainer')`), so no separate trainer fetch is needed. Only the recent-members fetch is kept (local to this view, not in the store).

- [ ] **Step 3.1: Replace the entire component**

  ```vue
  <!-- components/class/ClassOverview.vue -->
  <template>
    <div v-if="classStore.class" class="grid grid-cols-3 gap-6">
      <div class="col-span-2 space-y-6">
        <div>
          <h2 class="mb-3 text-base font-semibold text-gray-800">{{ $t('class.aboutClass') }}</h2>
          <p class="text-sm leading-relaxed text-gray-500">
            {{ classStore.class.general.description || $t('class.noDescription') }}
          </p>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-semibold text-gray-800">{{ $t('class.schedule') }}</h3>
          <div v-if="classStore.class.schedule?.length">
            <div
              v-for="(session, i) in classStore.class.schedule"
              :key="i"
              class="flex gap-3 border-b border-gray-100 py-2 last:border-0"
            >
              <span class="text-sm font-medium text-gray-700">
                {{ $t('schedule.days.' + session.dayOfWeek) }}
              </span>
              <span class="text-sm text-gray-400">{{ session.startTime }} - {{ session.endTime }}</span>
              <span v-if="session.room" class="text-xs text-gray-300">{{ session.room }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-gray-400">{{ $t('class.noSchedule') }}</p>
        </div>

        <div v-if="classStore.class.general.tags?.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="tag in classStore.class.general.tags"
            :key="tag"
            class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500"
          >{{ tag }}</span>
        </div>
      </div>

      <div class="space-y-4">
        <div class="rounded-lg border border-gray-200 bg-white p-5">
          <h3 class="mb-4 text-sm font-semibold text-gray-800">{{ $t('class.details') }}</h3>

          <dl class="space-y-3">
            <div>
              <dt class="text-xs text-gray-400">{{ $t('class.trainer') }}</dt>
              <dd class="text-sm text-gray-700">{{ trainerName }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400">{{ $t('class.location') }}</dt>
              <dd class="text-sm text-gray-700">{{ classStore.class.general.location || $t('common.notSet') }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400">{{ $t('class.capacity') }}</dt>
              <dd class="text-sm text-gray-700">
                {{ classStore.class.enrollmentCount || 0 }}/{{ classStore.class.general.capacity }}
                <span v-if="classStore.class.waitlistCount" class="ml-1 text-xs text-gray-400">
                  · {{ $t('class.waitlistCount', { count: classStore.class.waitlistCount }) }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400">{{ $t('class.type') }}</dt>
              <dd class="text-sm text-gray-700">{{ $t('class.types.' + classStore.class.general.type) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400">{{ $t('common.status') }}</dt>
              <dd class="mt-0.5"><ClassStatusBadge :status="classStore.class.general.status" /></dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400">{{ $t('common.createdAt') }}</dt>
              <dd class="text-sm text-gray-700">{{ getFormattedDate(classStore.class.createdAt) }}</dd>
            </div>
          </dl>

          <div class="mt-4">
            <Button class="w-full" @click="goToEdit">{{ $t('class.editClass') }}</Button>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-5">
          <h3 class="mb-3 text-sm font-semibold text-gray-800">{{ $t('class.recentMembers') }}</h3>
          <div v-if="recentMembers.length">
            <div
              v-for="member in recentMembers"
              :key="member._id"
              class="flex items-center justify-between border-b border-gray-50 py-1.5 last:border-0"
            >
              <span class="text-sm text-gray-700">
                {{ member.properties.firstName }} {{ member.properties.lastName }}
              </span>
              <MemberStatusBadge :status="member.status.confirmation" />
            </div>
          </div>
          <p v-else class="text-sm text-gray-400">{{ $t('class.noMembers') }}</p>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { getFormattedDate } from '~/utils/formatDate'

  const route = useRoute()
  const router = useRouter()
  const classStore = useClassStore()

  const recentMembers = ref([])

  const t = useT()
  const trainerName = computed(() => {
    const trainer = classStore.class?.general?.trainer
    if (!trainer) return t('common.tbd')
    return trainer.fullName || t('common.tbd')
  })

  onMounted(async () => {
    try {
      const data = await useApi().get(`/classes/${route.params._id}/members`, {
        limit: 5,
        sortField: 'createdAt',
        sortDirection: 'desc',
      })
      recentMembers.value = data.results
    }
    catch {}
  })

  const goToEdit = () => {
    router.push(`/classes/${route.params._id}/settings`)
  }
  </script>
  ```

- [ ] **Step 3.2: Verify**

  1. Open any class → Overview tab
  2. Confirm description, schedule, tags, trainer, location, capacity, waitlistCount (if any), created date, recent members all render
  3. Inspect the DOM — confirm no `style="..."` attributes exist on any element inside the component
  4. Check browser console — no `console.log` or `console.error` output
  5. All text is translated (change locale in settings to verify)

- [ ] **Step 3.3: Run lint**

  ```bash
  yarn lint
  ```

  Expected: no errors.

- [ ] **Step 3.4: Commit**

  ```bash
  git add components/class/ClassOverview.vue
  git commit -m "refactor(ClassOverview): replace inline styles with Tailwind, consume classStore, use useApi(), i18n"
  ```

---

## Task 4a — AI Enrollment Insights: Backend Endpoint

**Files:**
- Modify: `api/routes/ai/_ai.controller.js`
- Modify: `api/routes/ai/_ai.router.js`

- [ ] **Step 4a.1: Add `enrollmentInsights` to the AI controller**

  Replace `api/routes/ai/_ai.controller.js` with:

  ```js
  import { streamText, streamObject } from 'ai'
  import { anthropic } from '@ai-sdk/anthropic'
  import { z } from 'zod'

  const insightSchema = z.object({
    insights: z.array(z.object({
      type: z.enum(['warning', 'info', 'suggestion']),
      message: z.string(),
      recommendedAction: z.string(),
    })),
  })

  class Controller {
    async generateDescription(ctx) {
      const { title, type, trainerName, schedule } = ctx.request.body

      if (!title) ctx.throw(400, 'Class title is required')

      const scheduleText = schedule?.length
        ? schedule.map((s) => `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.dayOfWeek]} ${s.startTime}-${s.endTime}`).join(', ')
        : 'Schedule not set'

      const result = streamText({
        model: anthropic('claude-haiku-4-5-20251001'),
        maxTokens: 500,
        system: 'You are a fitness copywriter. Write compelling, concise class descriptions for a gym management platform. Keep descriptions under 3 paragraphs. Be energetic but professional.',
        prompt: `Write a class description for:
  - Title: ${title}
  - Type: ${type || 'General fitness'}
  - Instructor: ${trainerName || 'TBD'}
  - Schedule: ${scheduleText}

  Write only the description, no title or heading.`,
      })

      ctx.respond = false
      ctx.res.setHeader('Content-Type', 'text/event-stream')
      ctx.res.setHeader('Cache-Control', 'no-cache')
      ctx.res.setHeader('Connection', 'keep-alive')

      for await (const chunk of result.textStream) {
        ctx.res.write(chunk)
      }

      ctx.res.end()
    }

    async enrollmentInsights(ctx) {
      // All class and enrollment data comes from the frontend — no DB fetch needed.
      // Dynamic data is kept in the user-turn prompt only (never in the system prompt)
      // to prevent prompt injection via user-controlled strings.
      const {
        className,
        classType,
        trainerName,
        capacity,
        enrollmentCount,
        waitlistCount,
        schedule,
        members,
      } = ctx.request.body

      if (!className) ctx.throw(400, 'Class name is required')

      const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const scheduleText = schedule?.length
        ? schedule.map((s) => `${DAY_ABBREV[s.dayOfWeek]} ${s.startTime}-${s.endTime}`).join(', ')
        : 'Schedule not set'

      const confirmedCount = members?.filter((m) => m.status?.confirmation === 1).length || 0
      const pendingCount = members?.filter((m) => m.status?.confirmation === 0).length || 0
      const declinedCount = members?.filter((m) => m.status?.confirmation === -1).length || 0

      const result = streamObject({
        model: anthropic('claude-haiku-4-5-20251001'),
        schema: insightSchema,
        system: 'You are a gym operations analyst. Analyze class enrollment data and return 2–5 actionable insights for the gym admin. Be specific, concise, and data-driven. Each insight must have a type (warning/info/suggestion), a one-sentence message, and a short recommended action.',
        prompt: `Analyze enrollment for this class and generate insights:
  - Class: ${className}
  - Type: ${classType || 'General fitness'}
  - Trainer: ${trainerName || 'TBD'}
  - Schedule: ${scheduleText}
  - Capacity: ${enrollmentCount}/${capacity} confirmed${waitlistCount > 0 ? `, ${waitlistCount} waitlisted` : ''}
  - Status breakdown: ${confirmedCount} confirmed, ${pendingCount} pending, ${declinedCount} declined

  Generate insights. Examples of the kind of insights that are useful:
  - "3 members haven't confirmed — consider sending a reminder"
  - "This class is at 90% capacity — you may want to open a waitlist"
  - "Thursday sessions have lower attendance than Monday sessions"`,
      })

      ctx.respond = false
      ctx.res.setHeader('Content-Type', 'text/plain')
      ctx.res.setHeader('Cache-Control', 'no-cache')
      ctx.res.setHeader('Connection', 'keep-alive')

      for await (const partial of result.partialObjectStream) {
        ctx.res.write(JSON.stringify(partial) + '\n')
      }

      ctx.res.end()
    }
  }

  export default new Controller()
  ```

- [ ] **Step 4a.2: Register the route**

  ```js
  // api/routes/ai/_ai.router.js
  import KoaRouter from '@koa/router'
  import Controller from './_ai.controller.js'

  export const secretRoutes = new KoaRouter({ prefix: '/ai' })
    .post('/generate-description', Controller.generateDescription)
    .post('/enrollment-insights', Controller.enrollmentInsights)
  ```

- [ ] **Step 4a.3: Verify the endpoint responds**

  Restart `node api/index.js`, then:

  ```bash
  curl -s -X POST http://localhost:5051/api/ai/enrollment-insights \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <token_from_login>" \
    -d '{"className":"Yoga Flow","classType":"yoga","trainerName":"Sarah","capacity":10,"enrollmentCount":9,"waitlistCount":0,"schedule":[{"dayOfWeek":1,"startTime":"09:00","endTime":"10:00"}],"members":[{"status":{"confirmation":1}},{"status":{"confirmation":0}}]}'
  ```

  Expected: a stream of newline-delimited JSON lines, ending with a full `{"insights":[...]}` object.

- [ ] **Step 4a.4: Commit**

  ```bash
  git add api/routes/ai/_ai.controller.js api/routes/ai/_ai.router.js
  git commit -m "feat(ai): add enrollment-insights streaming endpoint with structured Zod output"
  ```

---

## Task 4b — AI Enrollment Insights: Frontend Component

**Files:**
- Create: `components/ai/AiEnrollmentInsights.vue`
- Modify: `pages/classes/[_id]/members.vue`

- [ ] **Step 4b.1: Create the insights component**

  ```vue
  <!-- components/ai/AiEnrollmentInsights.vue -->
  <template>
    <div class="rounded-lg border border-gray-200 bg-white p-5">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-800">{{ $t('ai.insights') }}</h3>
        <Button size="small" :loading="isGenerating" @click="generate">
          {{ isGenerating ? $t('ai.generating') : $t('ai.getInsights') }}
        </Button>
      </div>

      <div v-if="insights.length" class="space-y-3">
        <div
          v-for="(insight, i) in insights"
          :key="i"
          class="rounded-md border p-3"
          :class="{
            'border-yellow-200 bg-yellow-50': insight.type === 'warning',
            'border-blue-200 bg-blue-50': insight.type === 'info',
            'border-green-200 bg-green-50': insight.type === 'suggestion',
          }"
        >
          <p class="text-sm font-medium text-gray-800">{{ insight.message }}</p>
          <p v-if="insight.recommendedAction" class="mt-1 text-xs text-gray-500">
            {{ insight.recommendedAction }}
          </p>
        </div>
      </div>

      <p v-else-if="!isGenerating" class="text-sm text-gray-400">{{ $t('ai.noInsights') }}</p>
    </div>
  </template>

  <script setup>
  const props = defineProps({
    classData: { type: Object, required: true },
    classId: { type: String, required: true },
  })

  const authStore = useAuthStore()
  const membersStore = useMembersStore()
  const insights = ref([])
  const isGenerating = ref(false)

  const generate = async () => {
    isGenerating.value = true
    insights.value = []

    try {
      // Fetch ALL members unfiltered/unpaginated — not the store's current paginated/filtered view.
      // This ensures the AI sees the full enrollment picture regardless of what filters are active.
      const allMembers = await membersStore.fetchMembersForExport(props.classId)

      // Serialize only numeric/enum fields to avoid prompt injection
      // via user-controlled strings like member names or free-text notes
      const memberData = allMembers.map((m) => ({
        status: { confirmation: m.status.confirmation },
        enrolledAt: m.enrolledAt,
      }))

      const response = await fetch('/api/ai/enrollment-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({
          className: props.classData.general.title,
          classType: props.classData.general.type,
          trainerName: props.classData.general.trainer?.fullName,
          capacity: props.classData.general.capacity,
          enrollmentCount: props.classData.enrollmentCount || 0,
          waitlistCount: props.classData.waitlistCount || 0,
          schedule: (props.classData.schedule || []).map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
          members: memberData,
        }),
      })

      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep any incomplete trailing line
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const partial = JSON.parse(line)
            if (partial.insights) insights.value = partial.insights
          }
          catch {}
        }
      }
      // Flush any remaining buffer after stream ends
      if (buffer.trim()) {
        try {
          const p = JSON.parse(buffer)
          if (p.insights) insights.value = p.insights
        }
        catch {}
      }
    }
    catch {
      useToast().error(useT()('errors.generateDescription'))
    }
    finally {
      isGenerating.value = false
    }
  }
  </script>
  ```

- [ ] **Step 4b.2: Integrate the component into the members page**

  In `pages/classes/[_id]/members.vue`, add `classStore` access and the component. The full updated file:

  ```vue
  <template>
    <div class="flex flex-1 flex-col">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <TextInput
            v-model="search"
            :placeholder="$t('common.search')"
            class="w-64"
            @input="onSearch"
          />
          <div class="flex gap-2">
            <Button
              v-for="filter in statusFilters"
              :key="filter.value"
              :type="membersStore.filters.status === filter.value ? 'primary' : 'regular-outline'"
              size="small"
              @click="membersStore.filterMembers(classId, 'status', membersStore.filters.status === filter.value ? null : filter.value)"
            >
              {{ filter.label }}
            </Button>
          </div>
        </div>
        <div class="flex gap-2">
          <Button @click="openImport">
            {{ $t('common.import') }}
          </Button>
          <Button type="primary" @click="openAddMember">
            {{ $t('member.addMember') }}
          </Button>
        </div>
      </div>

      <div class="mb-6 flex flex-wrap gap-4">
        <StatTile v-for="stat in statTiles" :key="stat.label" :value="String(stat.value)" :label="stat.label" />
      </div>

      <div class="mb-6">
        <AiEnrollmentInsights
          v-if="classStore.class"
          :class-data="classStore.class"
          :class-id="classId"
        />
      </div>

      <MemberList
        :members="membersStore.members"
        :loading="membersStore.isLoading"
        :class-id="classId"
      />
    </div>
  </template>

  <script setup>
  const route = useRoute()
  const t = useT()
  useHead({ title: t('class.members') })
  const membersStore = useMembersStore()
  const classStore = useClassStore()
  const dialogStore = useDialogStore()

  const classId = computed(() => route.params._id)
  const search = ref('')

  const statusFilters = computed(() => [
    { value: 1, label: t('member.status.confirmed') },
    { value: 0, label: t('member.status.pending') },
    { value: 2, label: t('member.status.waitlisted') },
    { value: -1, label: t('member.status.declined') },
  ])

  const statTiles = computed(() => [
    { label: t('dashboard.totalMembers'), value: membersStore.stats.total },
    { label: t('member.status.confirmed'), value: membersStore.stats.confirmed },
    { label: t('member.status.pending'), value: membersStore.stats.pending },
    { label: t('member.status.waitlisted'), value: membersStore.stats.waitlisted },
    { label: t('member.status.declined'), value: membersStore.stats.declined },
  ])

  const openImport = () => {
    dialogStore.open({
      component: resolveComponent('MemberImport'),
      props: { classId: classId.value },
      title: t('member.importMembers'),
    })
  }

  const openAddMember = () => {
    dialogStore.open({
      component: resolveComponent('MemberForm'),
      props: { classId: classId.value },
      title: t('member.addMember'),
    })
  }

  const onSearch = useDebounceFn(() => {
    membersStore.setSearch(classId.value, search.value)
  }, 300)

  onMounted(() => {
    membersStore.resetMembers()
    membersStore.fetchMembers(classId.value)
  })
  </script>
  ```

- [ ] **Step 4b.3: Verify end-to-end**

  1. Open a class → Members tab
  2. Confirm the "AI Insights" panel is visible with a "Get Insights" button
  3. Click "Get Insights"
  4. Confirm insights appear incrementally as the stream arrives (not only at the end)
  5. Each insight has a colored background matching its type (warning=yellow, info=blue, suggestion=green)
  6. Stop the API server → click "Get Insights" again → confirm error toast appears

- [ ] **Step 4b.4: Run lint and tests**

  ```bash
  yarn lint
  yarn test:run
  ```

  Expected: no lint errors, all existing tests pass (only `utils/__tests__/formatDate.spec.js` and `tests/e2e/` tests exist; the unit tests should pass unchanged).

- [ ] **Step 4b.5: Commit**

  ```bash
  git add components/ai/AiEnrollmentInsights.vue pages/classes/[_id]/members.vue
  git commit -m "feat(ai): enrollment insights panel streams structured Zod output progressively"
  ```

---

## Final Checklist

- [ ] `yarn lint` passes with zero errors
- [ ] `yarn test:run` passes
- [ ] Task 1: schedule edit updates UI without reload
- [ ] Task 2: adding a member to a full class creates a `waitlisted` (`2`) record
- [ ] Task 2: deleting/declining a confirmed member promotes first waitlisted to confirmed
- [ ] Task 2: pending (`0`) status filter works (was broken before this fix)
- [ ] Task 2: waitlisted filter shows only waitlisted members
- [ ] Task 2: public "Join Waitlist" CTA on full class; success message differentiates pending vs waitlisted
- [ ] Task 3: ClassOverview renders correctly with no inline styles, no `$fetch`, no `console.*`
- [ ] Task 4: AI insights stream progressively and each insight has type + message + recommendedAction
