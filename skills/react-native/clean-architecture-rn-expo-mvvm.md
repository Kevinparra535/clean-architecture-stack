---
name: clean-architecture-rn-expo-mvvm
description: Apply our standard Clean Architecture for React Native (Expo) using MVVM + MobX + Inversify. Use this when creating new features, screens, viewmodels, use cases, repositories, services, and DI bindings.
---

# Skill Instructions — Clean Architecture (RN Expo + MVVM + MobX + Inversify)

## When to use

Use this skill whenever you:

- Add a new screen/feature module
- Create or refactor ViewModels, UseCases, repositories, services
- Touch DI (`src/config/di.ts`, `src/config/types.ts`)
- Need folder placement conventions or dependency direction rules

## Non-negotiable rules (dependency direction)

- UI/View depends on ViewModel only.
- ViewModel depends on UseCases (NOT repositories directly).
- UseCases depend on domain contracts (interfaces), not data implementations.
- Data layer implements repositories/services and talks to Firebase/network.
- Keep domain layer free of framework/infrastructure.
- ViewModel MUST be UI-agnostic: no React hooks, no navigation calls, no Alert/toast/snackbar APIs, no component imports.
- UI screens should stay thin: bind inputs, call VM actions, and render VM state.

## SOLID requirements (must apply)

- **S — Single Responsibility:** Screen renders UI only, ViewModel manages presentation state/actions, UseCase executes one business action, Repository/Service handles persistence/integration concerns.
- **O — Open/Closed:** extend behavior through new use cases/services or new implementations; avoid editing stable contracts unless the requirement truly changes.
- **L — Liskov Substitution:** every implementation must be safely substitutable for its interface (same input/output expectations, no hidden side effects).
- **I — Interface Segregation:** prefer small focused contracts; split interfaces when consumers use only subsets of behavior.
- **D — Dependency Inversion:** upper layers depend on abstractions from `domain/*`; concrete implementations are wired only through DI (`TYPES` + bindings).

## Folder placement

- UI screens + components: `src/ui/...`
- ViewModels: colocated next to screens (e.g. `src/ui/screens/<Feature>/<Feature>ViewModel.ts`)
- Use cases: `src/domain/useCases/<UseCaseName>/index.ts` (one folder per use case)
- Domain entities: `src/domain/entities/`
- Repository contracts: `src/domain/repositories/`
- Domain services contracts: `src/domain/services/`
- Data implementations: `src/data/...` (services/network/models/repositories)
- Data models: `src/data/models/<entityModel>.ts` with `fromJson/toJson/toDomain`

## Naming conventions

- `XxxScreen.tsx`
- `XxxViewModel.ts`
- `<UseCaseName>/index.ts` for each use case folder (e.g. `GetAllBankUseCase/index.ts`)
- `XxxRepository` (interface in domain)
- `XxxRepositoryImpl` (implementation in data)
- `XxxService` / `XxxServiceImpl` as needed

## Lint + format baseline (mandatory)

- Keep and use existing project config files: `eslint.config.js`, `.prettierrc`, `.prettierignore`.
- Required scripts in `package.json`:
  - `lint`: `eslint .`
  - `lint:fix`: `eslint . --fix`
  - `format`: `prettier --write .`
  - `format:check`: `prettier --check .`
- Keep `eslint-config-prettier` enabled in flat config to avoid lint/format rule conflicts.
- Before final handoff of architecture/scaffold tasks, run `npm run lint` and `npm run format:check`.

## UseCase base contract (mandatory)

- Keep `src/domain/useCases/UseCase.ts` as the canonical base interface.
- Every use case file MUST import `UseCase` from `@/domain/useCases/UseCase`.
- Every use case class MUST `implement UseCase<Input, Output>`.
- Use `run(data)` as the execution method name (or `run()` with `void` input), not ad-hoc method names.

## Entity + model contract (mandatory)

- Entities in `domain/entities` MUST be class-based with constructor params type, `[key: string]: any`, and `Object.assign(this, params)`.
- Models in `data/models` MUST expose:
  - constructor params type
  - conversion helper(s) for dates (`unknown` → `Date`)
  - `static fromJson(json)`
  - `toJson()`
  - module augmentation + `prototype.toDomain()` that returns the domain entity class
- Keep exact field names defined by product/backend (`snake_case`, custom names, etc.).

### Minimal reference pattern

```ts
export type XxxConstructorParams = { id: string; [key: string]: any };

export class Xxx {
  [key: string]: any;
  id: string;

  constructor(params: XxxConstructorParams) {
    this.id = params.id;
    Object.assign(this, params);
  }
}
```

```ts
export class XxxModel {
   static fromJson(json: any): XxxModel {
      return new XxxModel({ ...json });
   }

   toJson(): Record<string, unknown> {
      return { ... };
   }
}

declare module './xxxModel' {
   interface XxxModel {
      toDomain(): Xxx;
   }
}

XxxModel.prototype.toDomain = function toDomain(): Xxx {
   return new Xxx({ ... });
};
```

## DI requirements (Inversify)

- All injectable classes must use `@injectable()`
- Constructor dependencies must use `@inject(TYPES.Something)`
- Register in `src/config/di.ts` and add symbol in `src/config/types.ts`
- Prefer Singleton for services/managers; transient for UseCases and ViewModels unless specified

### DI binding checklist

When adding a new module:

1. Add `TYPES.<NewThing>` in `types.ts`
2. Bind in `di.ts`:
   - Manager/Service: `.inSingletonScope()` if shared
   - UseCases: transient
   - ViewModel: transient (or singleton only if truly global)

## ViewModel pattern (MobX)

- Use `makeAutoObservable(this)` inside constructor
- Keep state as fields; actions as methods; computed as getters
- Prefer `reaction(...)` for autosave side effects (with debounce)
- Never put direct Firebase calls in UI components—only in VM via UseCases
- Keep business flow decisions in VM (create vs update, initialize/load, mapping form values to domain entities)
- UI should not contain branching business flow beyond simple event wiring (`onPress`, `onChange`, `useEffect` bridge)

### ViewModel naming standard (mandatory)

- For every async responsibility, use grouped and explicit names:
  - `isCreate<Entity>Loading / isCreate<Entity>Error / isCreate<Entity>Response`
  - `is<Entity>Loading / is<Entity>Error / is<Entity>Response`
  - `isUpdate<Entity>Loading / isUpdate<Entity>Error / isUpdate<Entity>Response`
- `ICalls` can remain operation-centered (`'loadBank' | 'createBank' | 'updateBank'`), but public state naming should prioritize readability and direct responsibility.
- If the screen needs form defaults for edit mode, expose a VM getter (e.g. `formValues`) instead of composing values in UI.
- `reset()` must clear transient UI-facing VM state (loading/error/success flags), while preserving persisted domain state only if intended.

## Unit testing requirements (must apply)

- Add unit tests for UseCases and ViewModels when creating/refactoring features.
- Use `jest.fn()` mocks for repository/service contracts (no DI container required in tests).
- Validate success and failure paths for critical actions.
- Assert collaboration contracts (`toHaveBeenCalledWith`) between ViewModel → UseCase and UseCase → Repository.
- Keep tests deterministic (no real network/Firebase, avoid real timers unless necessary).
- Testing stack standard: **Jest + jest-expo** (do not use Vitest in this repository).
- Global test noise control: keep `console.error/console.warn` silenced via `src/__test__/setupTests.ts`.
- Coverage command and threshold baseline: `npm run test:coverage` must stay above **70% global** at minimum.

### Coverage policy (important)

- Prefer covering behavior over forcing artificial assertions.
- It is valid to exclude non-behavioral files from coverage when they only add report noise:
  - logging utility wrappers (e.g., `src/ui/utils/Logger.ts`)
  - pure type/interface contracts with no runtime behavior (e.g., `domain/repositories/*` interfaces)
- Do not exclude business logic files just to inflate metrics.

### ViewModel test focus (mandatory)

- Cover computed getters used by UI (`isLoaded`, `submitError`, `hasSubmitSuccess`, etc.).
- Cover initialize/entrypoint flows (`initialize`, `submit`, `consumeResult`, `reset`).
- Cover both `Error` and non-`Error` failure values where error normalization exists.
- Include branch cases for mode/fallback logic (e.g., create vs update, null response, stale/debounced states).

### Minimum unit test checklist

1. UseCase happy path (expected output + dependency call assertions)
2. UseCase error path (propagation/handling)
3. ViewModel action state transitions (`loading`, `error`, domain state fields)
4. At least one mutating action (`create`/`update`/`delete`) with success + failure scenarios
5. ViewModel computed/getter coverage and result-consumption methods (`consume*Result`, `reset`)
6. If a service normalizes API responses/errors, include wrapped and plain payload test cases

## Output expectations

When implementing a request:

- Propose the file list you will create/edit
- Follow the layer rules above
- Provide minimal diffs or clear code blocks per file
- Update DI bindings if new classes are added
- Include unit test files/cases added and how to run them (`npm test` or targeted jest command)

---

## Reference

This project follows:

- React Native (Expo) + MVVM
- MobX for state
- Inversify for DI
- UseCases layer per action
- Data layer (RepoImpl → Service → Firebase)
