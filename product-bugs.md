# Product bugs surfaced by the test work (NOT fixed - need a decision)

The suite is green apart from 11 tests, and every one of them is held open deliberately as
the standing signal for a defect below. Fixing the product code turns them green; nothing
in the specs needs to change.

| Failing tests | Entry | One-line fix |
|---|---|---|
| `assessment-builder` x4 | 5 | restore the orphaned `QUESTIONSET_CONTEXT_CATEGORY` |
| `approval-pending` x3 | 1 | `searchText ? searchText.toLowerCase() : ''` |
| `budget` x2 | 6 | guard `preventHtmlAndJs` with `typeof value === 'string'` |
| `notification` x1 | 19 | delete the stray `="re check notifications"` |
| `share-toc` x1 | 3 | `mat-chip-list` -> `mat-chip-grid` |

The rest of the entries are defects with no failing test attached: the spec asserts the
behaviour as it currently is, with a comment pointing back here, so the test flips to
failing the moment someone fixes the product code - which is the prompt to restore the
real assertion.


## 1. Case-insensitive search is broken in approval-pending
`project/ws/app/.../approvals/approval-pending/approval-pending.component.ts:362`
```ts
this.searchfilterValue = enterValue.searchText.toLowerCase() ? enterValue.searchText : ''
```
`.toLowerCase()` is used only as a truthiness check and its result discarded, so the value
keeps its original casing. It is then compared against a lowercased haystack
(`user.fullname.toLowerCase().includes(this.searchfilterValue)`), so searching "John"
matches nothing. Intended: `enterValue.searchText ? enterValue.searchText.toLowerCase() : ''`

## 2. Select-all checkbox announces the wrong label
`project/ws/app/src/lib/head/work-allocation-table/work-allocation-list/table.component.ts:231`
```ts
return `${this.isAllSelected() ? 'select' : 'deselect'} all`
```
Inverted: announces "deselect all" when nothing is selected. Accessibility-only.
Intended: `${this.isAllSelected() ? 'deselect' : 'select'} all`

## 3. mat-chip-list removed in Angular Material 15 - 11 live components still use it
Repo is on @angular/material 20.2.14. Not caught by the build because all five build
scripts pass `--aot=false`, so templates are never type-checked.

Hard failure (binds [matChipInputFor], throws `_chipGrid.registerInput is not a function`):
  users/routes/view-user/view-user.component.html
  state-profile/routes/training-rograms/training-rograms.component.html
  home/routes/events-2/components/event-details/event-details.component.html  (x2)
  app-toc/share-toc/share-toc/share-toc.component.html

Degraded rendering (display-only chips, silently unstyled):
  viewer/plugins/practice/practice.component.html (27 uses)
  home/components/request-list/create-request-form/create-request-form.component.html (6)
  home/routes/community/components/add-moderator/add-moderator.component.html (4)
  search/components/qanda-card, search/routes/learning,
  approvals/routes/position, training-plan/routes/preview-plan (2 each)

Fix is template-only (MatChipsModule already exports the replacements):
  <mat-chip-list> -> <mat-chip-grid> (or <mat-chip-set> for display-only)
  <mat-chip> -> <mat-chip-row> inside a grid

## 4. offline-session imports a path the package does not expose
`project/ws/viewer/src/lib/routes/offline-session/offline-session.component.ts:11`
```ts
import { AccessControlService } from '@sunbird-cb/toc/lib/services/access-control.service'
```
`@sunbird-cb/toc` is flat (index.d.ts only). AccessControlService IS exported from the
package root, so the fix is `from '@sunbird-cb/toc'`. File is dead code (unreachable from
src/main.ts), which is why the build does not fail.

## Root cause worth addressing
Re-enable AOT on at least one CI build (`--aot=true`). Items 3 and 4 would both have failed
the build at migration time instead of reaching runtime.

## 5. Comprehensive assessment config emits empty contextCategory and name
`project/ws/app/.../comprehensive-assessment/components/assessment-builder/assessment-builder.component.ts:41`
```ts
buildConfig(): comprehensiveAssessment.IAssessmentConfig {
  return {
    identifier: this.assessmentId || '',
    primaryCategory: QUESTIONSET_PRIMARY_CATEGORY,
    courseCategory: CONTENT_COURSE_CATEGORY,
    // written onto the question set as it is created, and the only thing that tells a Live
    // comprehensive assessment from any other Course Assessment
    contextCategory: '',      // <-- always empty
    name: '',                 // <-- ignores the @Input() assessmentName
    isReadOnly: this.openMode === 'view',
  }
}
```
Two problems:
- `contextCategory` is blank despite the comment saying it is the only marker distinguishing
  a Live comprehensive assessment. The constant meant for it,
  `QUESTIONSET_CONTEXT_CATEGORY = 'Comprehensive Assessment'`
  (models/comprehensive-assessment.model.ts:22), is now referenced ONLY by the spec - the
  component no longer imports it.
- `name` is hardcoded empty even though `@Input() assessmentName` is declared and is what
  ngOnChanges watches to rebuild the config.

4 tests in assessment-builder.component.spec.ts assert the intended values and are left
failing deliberately, as the signal for this. They were written to catch exactly this.

## 6. preventHtmlAndJs validator throws on non-string values
`project/ws/app/src/lib/routes/validators/prevent-html-and-js.validator.ts:7`
```ts
const value = control.value
if (value && value.match(/<[^>]*>|(function[^\s]+)|(javascript:[^\s]+)/i)) {
```
`.match` is called on whatever the control holds. BudgetComponent.getBudgetDetails sets
numbers straight from the API into controls that carry this validator:
```ts
this.budgetdata.controls['salarybudget'].setValue(sres.salaryBudgetAllocated)   // a number
```
which throws `TypeError: value.match is not a function` during validation, aborting the
rest of getBudgetDetails (overallbudget is never assigned, the table is never filled).

Two tests in `budget.component.spec.ts` are left failing as the standing signal for this:
"should successfully get budget details" and "should open add scheme dialog and add new
scheme". Both die inside the validator, not in the spec. A one-line guard
(`typeof value === 'string' && value.match(...)`) fixes the validator and both tests.

One-line fix:
```ts
if (typeof value === 'string' && value.match(/.../i)) {
```
The validator is shared, so anything else assigning numeric/boolean values to a control
using it hits the same crash.

Tests blocked by this: 3 in budget.component.spec.ts

## 7. Certificate dialog guard compares a property of an array
`project/ws/app/.../blended-program-approvals/components/profile-view/profile-view.component.ts:193`
```ts
if (value.issuedCertificates.identifier === value.identifier) {
```
`issuedCertificates` is an array, so `.identifier` on it is always undefined. When the item
also has no `identifier`, the comparison is `undefined === undefined` and the certificate
dialog opens for a certificate that does not match. Likely intended:
```ts
if (value.issuedCertificates[0].identifier === value.identifier) {
```
(or a find over the array).

## 9. BudgetComponent.ngOnChanges guards on one path and reads another
`project/ws/app/src/lib/routes/home/routes/budget/budget.component.ts:149`
```ts
ngOnChanges(data: SimpleChanges) {
  this.dataSource.data = data.currentValue ? _.get(data, 'data.currentValue') : []
```
The guard tests `data.currentValue`, but a `SimpleChanges` is keyed by input name, so the
value it actually wants is `data.data.currentValue`. The guard can therefore never be true
and the branch always clears the table. Moot in practice: the component declares no
`@Input`, so Angular never calls the hook - which is itself worth confirming, since the
hook's existence implies a `data` input was intended.

Covered by `budget.component.spec.ts` "should handle ngOnChanges", which asserts the
cleared table with a comment pointing here.

## 10. Create Event crashes between 23:30 and midnight
`project/ws/app/src/lib/routes/events/routes/create-event/create-event.component.ts:200`
```ts
this.timeArr.forEach((time: any) => {
  if (time.value > currentTime) { newtimearray.push(time) }
})
this.timeArr = newtimearray
this.todayTime = this.timeArr[0].value   // <- throws when nothing is left
```
`timeArr` is a fixed list of half-hour slots whose last entry is `23:30`. ngOnInit keeps
only the slots later than the current wall-clock time, so from 23:30 local onwards the
filtered list is empty and `timeArr[0].value` throws
`TypeError: Cannot read properties of undefined (reading 'value')`, taking down the whole
Create Event page. The same unguarded read appears again at line 395 in the
date-changed handler.

Observed live: the same spec failed at 23:53 and passed unchanged at 00:05.

Likely intent is to fall back to the next day's first slot when today has none left. The
spec now pins the clock (`jest.useFakeTimers().setSystemTime(...)`) so it no longer depends
on when CI happens to run; that makes the test deterministic but does not fix the page.

## 11. Learner profile link is always "#" in blended-program approvals
`project/ws/app/src/lib/routes/blended-program-approvals/components/learner-responses/learner-responses.component.ts:120`
```ts
profileLink: this.getProfileLink(res.profileDetails),
...
getProfileLink(res: NSProfileDataV2.IProfile) {
  if (res && res.userId) { return `/app/profile/${res.userId}` }
  return '#'
}
```
`getProfileLink` is typed to take the whole profile and reads `userId` off it, but the call
passes the nested `res.profileDetails`, which carries no `userId` (nothing else in the
codebase reads `profileDetails.userId`). The guard therefore always fails and every
learner's name links to `#`. Passing `res` instead fixes it.

Asserted as-is in `learner-responses.component.spec.ts` with a comment pointing here.

## 12. HandsOnComponent template indexes through a safe-navigation guard
`project/ws/viewer/src/lib/plugins/hands-on/hands-on.component.html:34`
```html
{{ (exerciseData?.supportedLanguages)[0].language }}
```
`?.` guards the property read but not the `[0]` that follows, so when `exerciseData` is
null - its declared initial value, before `handsOn` has been parsed - the expression throws
`TypeError: Cannot read properties of null (reading '0')` and the view never renders.
Lines 40 and 44 do the same inside commented-out markup.

An `*ngIf="exerciseData?.supportedLanguages?.length"` on the surrounding card, or
`exerciseData?.supportedLanguages?.[0]?.language`, would fix it. The spec seeds
`exerciseData` before the first change detection and points here.

## 13. FacultyComponent never completes its takeUntil subject
`project/ws/app/src/lib/routes/state-profile/routes/faculty/faculty.component.ts:23,60`
```ts
private unsubscribe = new Subject<void>()
...
takeUntil(this.unsubscribe)
```
The component declares no `ngOnDestroy`, so nothing ever calls `unsubscribe.next()` or
`.complete()`. The `takeUntil` therefore never fires and the subscription outlives the
component - it leaks for the lifetime of the app, and re-entering the page adds another.

The one-line fix is the usual hook:
```ts
ngOnDestroy() { this.unsubscribe.next(); this.unsubscribe.complete() }
```
The spec asserts that the hook is absent, so adding it fails that test and prompts
restoring the real next()/complete() assertions, which are preserved in git history.

## 14. AllUsersComponent files every user list under the tab that happens to be open
`project/ws/app/src/lib/routes/home/routes/users-view/all-users/all-users.component.ts:191,243`
```ts
getUsers(qText: string, currentFilter: any) {
  if (currentFilter === 'allusers') { ... }          // request built from the ARGUMENT
  ...
  if (this.currentFilter === 'allusers') {           // response filed under the FIELD
    this.activeUsersData = usersData
  } else if (this.currentFilter === 'verified') { ... }
```
ngOnInit fires three fetches with explicit arguments:
```ts
this.getUsers('', 'allusers'); this.getUsers('', 'verified'); this.getUsers('', 'nonverified')
```
but `this.currentFilter` is still its initial `'allusers'` for all three, so all three
responses overwrite `activeUsersData` in turn and `verifiedUsersData` /
`nonverifiedUsersDataCount` are never set - the Verified and Not-verified tabs come up
empty until the user switches tabs and triggers a refetch.

Second defect in the same block (line 249): the `'nonverified'` branch assigns to
`notmyuserUsersData`, which is the `'notmyuser'` tab's list, rather than
`nonverifiedUsersData`.

Both are fixed by keying the response off the same `currentFilter` argument the request
used. The spec sets `component.currentFilter` explicitly and points here.

## 15. Double slash in the assign-admin endpoint
`project/ws/app/src/lib/head/work-allocation-table/create-mdo.services.ts:9,54`
```ts
ASSIGN_ADMIN_TO_CREATED_DEPARTMENT: '/apis/protected/v8/portal/spv/deptAction/',
...
return this.http.post<any>(`${API_END_POINTS.ASSIGN_ADMIN_TO_CREATED_DEPARTMENT}/userrole`, departmentData)
```
The constant already ends in a slash and the template adds another, so every call goes to
`/apis/protected/v8/portal/spv/deptAction//userrole`. Proxies usually collapse this, which
is why it has gone unnoticed, but a strict router will 404 on it. Dropping either slash
fixes it. `create-mdo.service.spec.ts` asserts the URL as it is actually sent.

## 16. catalogPaths facet is emptied instead of flattened
`project/ws/app/src/lib/head/_services/search-api.service.ts:39-68`

The facet mapping copies only four fields out of each facet value:
```ts
temp.content.push({ displayName: subEle.name, type: subEle.name, count: subEle.count, id: '' })
```
and the step right after it tries to flatten a single-path catalog by reaching for a field
that mapping never carried over:
```ts
if (filter.type === 'catalogPaths') {
  if (filter.content.length === 1) {
    filter.content = filter.content[0].children || []   // children is always undefined
  }
}
```
So whenever the search returns exactly one top-level catalog path, its facet is replaced
with an empty array and the whole catalog filter disappears from the UI rather than showing
that path's children.

Fix by carrying `children` through the mapping (`children: (subEle as any).children`), or by
flattening from `ele.values` before the fields are dropped. Covered by
`search-api.service.spec.ts` "should handle catalogPaths filter appropriately".

## 17. AboutVideoComponent.ngOnInit throws when there is no instance config
`project/ws/app/src/lib/routes/info/about-video/about-video.component.ts:41-52`
```ts
if (this.configSvc.instanceConfig) {
  this.introVideos = this.configSvc.instanceConfig.introVideo   // guarded
  ...
}
...
this.locale = Object.keys(this.introVideos).includes(this.locale) ? this.locale : 'en'   // not
```
The guard shows the author expected `instanceConfig` to be absent sometimes, but
`introVideos` is then dereferenced unconditionally, so `Object.keys(undefined)` throws
`TypeError: Cannot convert undefined or null to object` and the About Video page renders
nothing. The same field is indexed again at lines 57 and 70.

A `|| {}` fallback on `introVideos`, or moving the locale/widget setup inside the existing
guard, fixes it. Pinned by `about-video.component.spec.ts` "should currently throw when
instanceConfig is undefined", which fails once the behaviour changes.

## 18. AdmintableComponent.getUsers throws when the org has no admins yet
`project/ws/app/src/lib/routes/home/components/admintable/admintable.component.ts:47,129-139`
```ts
usersData1: any          // no initialiser
...
if (res.result.response.content.length > 0) {
  ...
  this.usersData1 = result            // only assigned when the response is non-empty
}
this.data = []
if (this.usersData1.length > 0) {     // throws when it was never assigned
```
`ngOnInit` calls `getUsers('MDO_ADMIN')` on every load. For an organisation with no admins
the response content is empty, `usersData1` is still `undefined`, and reading `.length`
throws `TypeError` inside the subscriber - which under RxJS 7 surfaces as an unhandled
error rather than a visible failure, so the table simply never populates and the
`getAllUsers` fallback below it never runs.

Initialising `usersData1: any[] = []` fixes it. The spec seeds the field and points here.

## 19. Notifications page cannot render - malformed attribute in the template
`project/ws/app/src/lib/routes/notification/components/notification/notification.component.html:6`
```html
    type="button"="re check notifications" aria-label="refresh notifications">
```
There is a stray `="re check notifications"` after `type="button"`. Angular's template
parser reads the leftover as an attribute with an empty name, and the DOM refuses it:
`InvalidCharacterError: "" did not match the Name production`. The error is thrown while
the view is being created, so the whole Notifications page fails to render - not a
degraded control, the entire route.

This is not caught at build time because all five build scripts in package.json pass
`--aot=false`, so templates are only compiled in the browser. (Same root cause as entry 3.)

Deleting the stray `="re check notifications"` fixes it; the neighbouring
`title="re-check notifications"` already says the same thing. `notification.component.spec.ts`
"should create" is left failing as the standing signal.

## Note on entries 4 and the unreachable services

`npx tsc -p tsconfig.app.json --listFilesOnly` shows that none of the following are pulled
into the application bundle, so the defects in them are latent rather than live:

- `project/ws/viewer/src/lib/routes/offline-session/` (entry 4)
- `project/ws/app/src/lib/head/_services/dynamic-assets-loader.service.ts`
- `project/ws/app/src/lib/head/_services/widget-content-share.service.ts`
- `project/ws/viewer/src/lib/resolvers/config-resolver.service.ts`

All four fail to type-check against their current dependencies, so their specs could not
compile. They are excluded in `jest.config.js` alongside the dead app-toc subtree, with the
reason recorded there. If any of them is revived, the exclusion has to come off and the
type errors fixed first.

## 20. "Profile updated on" shows a full timestamp instead of a date
`project/ws/app/src/lib/routes/home/components/user-cards/user-card.component.ts:197-203`
```ts
constructor(...) {
  ...
  if (this.usersData && this.usersData.length > 0) {
    // formatting profileStatusUpdatedOn value
    this.usersData.forEach((u: any) => {
      if (u.profileDetails.profileStatusUpdatedOn) {
        const val = u.profileDetails.profileStatusUpdatedOn.split(' ')
        u.profileDetails.profileStatusUpdatedOn = val[0]
      }
    })
  }
}
```
`usersData` is an `@Input`, and Angular sets inputs after the constructor has run, so this
block always sees `undefined` and never executes. `ngOnChanges` re-sorts the same list but
does not repeat the formatting, so the raw `"2023-01-01 12:00:00"` reaches the template
where only the date was meant to show.

Moving the loop into `ngOnChanges` next to the sort fixes it. `user-card.component.spec.ts`
asserts the unformatted value and points here.
