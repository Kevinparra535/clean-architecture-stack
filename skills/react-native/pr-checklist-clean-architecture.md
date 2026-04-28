---
name: pr-checklist-clean-architecture
description: Review a PR or changeset to ensure Clean Architecture (RN Expo + MVVM + MobX + Inversify) rules are respected. Use when asked to review code or before merging.
---

# PR Checklist — Clean Architecture Compliance

## Dependency direction

- [ ] UI does not import `data/*` or Firebase directly
- [ ] ViewModels do not import `data/*`
- [ ] UseCases do not import `data/*`
- [ ] Domain does not import framework libs

## Layer correctness

- [ ] New actions are modeled as UseCases (1 action = 1 use case)
- [ ] Repositories are interfaces in `domain/` and implemented in `data/`
- [ ] Data returns mapped domain entities (no Firestore snapshots to UI)

## DI correctness

- [ ] New TYPES added in `types.ts`
- [ ] Bindings exist in `di.ts` with appropriate lifetimes
- [ ] All injected classes are `@injectable()`
- [ ] Constructor deps use `@inject(TYPES.X)`

## ViewModel quality

- [ ] `makeAutoObservable(this)` used
- [ ] Actions / computed are clear
- [ ] Side effects use `reaction` with debounce when needed
- [ ] Error & loading states handled
- [ ] ViewModel is UI-agnostic (no navigation/Alert/toast/hooks/components)
- [ ] Async state naming is explicit by responsibility (`isCreateXLoading`, `isXResponse`, `isUpdateXError`, etc.)
- [ ] Screen keeps minimal logic (no create-vs-update business branching in UI)
- [ ] Form hydration/transformation logic lives in VM (e.g. `formValues` getter)

## Testing / QA

- [ ] Clear steps to validate feature
- [ ] `npm run test` passes locally
- [ ] `npm run test:coverage` passes and global coverage stays ≥ 70%
- [ ] New/changed ViewModels include tests for success, error, and computed state branches
- [ ] UseCases include contract-collaboration tests (`toHaveBeenCalledWith`)
- [ ] Services/repositories with mappers include unwrap/normalization branch tests when applicable
- [ ] No network/Firebase calls in unit tests (all external deps mocked)
- [ ] Global test setup is respected (`src/__test__/setupTests.ts`) to keep CI output clean
- [ ] Coverage exclusions are justified and limited to non-behavioral files (e.g., logger wrappers, pure interfaces)
- [ ] No sensitive keys committed
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] Build/typecheck passes (if applicable)
