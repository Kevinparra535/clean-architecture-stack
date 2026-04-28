---
name: feature-scaffold-rn
description: Scaffold a new feature module in RN (Expo) following our MVVM + MobX + Inversify Clean Architecture. Use when creating a new screen/feature end-to-end with UseCases, repository contract, repo impl, service, and DI bindings.
---

# Feature Scaffold — RN (Expo) + MVVM + MobX + Inversify

## Goal

Given a feature name (e.g., "Clients", "Measurements", "Sessions"), generate the **full vertical slice**:
UI Screen + ViewModel + UseCases + Domain contracts + Data implementations + DI bindings.

---

## Ask from user input (infer if missing)

- Feature name (PascalCase): `Feature`
- Main entities involved (e.g., Client, Session)
- CRUD actions required (default: list/get/create/update/delete)
- Data source / manager (default: REST via Axios)

If user didn't specify, assume:

- REST backend with Axios manager
- Standard CRUD use cases
- Minimal UI skeleton + basic VM state/actions

---

## Files to create (default scaffold)

### UI

- `src/ui/screens/<Feature>/<Feature>Screen.tsx`
- `src/ui/screens/<Feature>/<Feature>ViewModel.ts`
- `src/ui/screens/<Feature>/components/` (only if needed)

### Domain

- `src/domain/entities/<Entity>.ts` (if new)
- `src/domain/repositories/<Feature>Repository.ts`
- `src/domain/useCases/`
  - `GetAll<Feature>UseCase/index.ts`
  - `Get<Feature>UseCase/index.ts`
  - `Create<Feature>UseCase/index.ts`
  - `Update<Feature>UseCase/index.ts`
  - `Delete<Feature>UseCase/index.ts`
  - `UseCase.ts` (base interface)

### Data

- `src/data/models/<entityModel>.ts` (DTO/JSON ↔ Domain mapper)
- `src/data/services/<Feature>Service.ts` (service that delegates to the selected manager)
- `src/data/repositories/<Feature>RepositoryImpl.ts`

### DI

- Edit `src/config/types.ts`
- Edit `src/config/di.ts`

### Unit tests

- `src/__test__/domain/useCases/<feature>/` (use case tests)
- `src/__test__/ui/viewModels/<Feature>ViewModel.test.ts` (viewmodel tests)
- Optional: `src/__test__/data/repositories/<Feature>RepositoryImpl.test.ts` (mapping/contract tests)
- Recommended: `src/__test__/data/services/<Feature>Service.test.ts` when service has unwrap/normalization logic
- Recommended: `src/__test__/data/network/*HttpManager.test.ts` when adding/changing transport adapters

---

## Implementation rules

- UI depends only on ViewModel
- ViewModel depends only on UseCases
- UseCases depend only on domain contracts
- Data layer implements contracts and calls service/network
- Keep manager details isolated in service/network adapters (Axios, Firebase, GraphQL, etc.)
- Map transport models to domain entities (don't leak manager-specific shapes to domain/UI)
- ViewModel must remain UI-agnostic (no navigation APIs, no Alert/toast APIs, no React hooks)
- Keep screen logic minimal: bind fields, call VM methods, render VM state/errors/loading

### Entity and model structure (mandatory)

- Domain entities MUST be class-based (not plain interfaces) with:
  - `type <Entity>ConstructorParams`
  - index signature `[key: string]: any`
  - constructor assigning required fields and defaults for dates/errors
  - `Object.assign(this, params)`
- Data models MUST follow this shape:
  - `type <Entity>ModelConstructorParams`
  - utility date parser (e.g. `toDate(value: unknown): Date`)
  - `static fromJson(json)`
  - `toJson(): Record<string, unknown>`
  - `declare module './<entityModel>'` + `prototype.toDomain()` returning domain entity
- Preserve backend field names exactly as requested (snake_case or custom names), do not auto-rename.

### Canonical templates (reference)

- Entity template:

```ts
export type <Entity>ConstructorParams = {
  id: string;
  // ...fields
  [key: string]: any;
};

export class <Entity> {
  [key: string]: any;

  id: string;
  // ...fields

  constructor(params: <Entity>ConstructorParams) {
    this.id = params.id;
    // ...assignments
    Object.assign(this, params);
  }
}
```

- Model template:

```ts
export class <Entity>Model {
  static fromJson(json: any): <Entity>Model {
    return new <Entity>Model({ ...json });
  }

  toJson(): Record<string, unknown> {
    return { ... };
  }
}

declare module './<entityModel>' {
  interface <Entity>Model {
    toDomain(): <Entity>;
  }
}

<Entity>Model.prototype.toDomain = function toDomain(): <Entity> {
  return new <Entity>({ ... });
};
```

### Apply SOLID explicitly

- **S — Single Responsibility:** each class has one reason to change (Screen renders UI, ViewModel orchestrates state/actions, UseCase executes one business action, Repository handles persistence contract).
- **O — Open/Closed:** extend behavior by adding new UseCases/services, avoid modifying existing stable contracts unless required.
- **L — Liskov Substitution:** implementations (`XxxRepositoryImpl`, `XxxServiceImpl`) must respect interface behavior and return types without surprises.
- **I — Interface Segregation:** prefer small focused contracts (split read/write concerns when needed) instead of large "god interfaces".
- **D — Dependency Inversion:** depend on abstractions (`domain/repositories`, `domain/services`) and inject via Inversify `TYPES`, never on concrete data classes in domain/UI layers.

### Use case convention (mandatory)

- Each use case MUST live in its own folder: `src/domain/useCases/<UseCaseName>/index.ts`.
- Every use case MUST import `UseCase` from `src/domain/useCases/UseCase.ts`.
- Every use case class MUST `implement UseCase<Input, Output>`.
- Public execution method MUST be named `run(data)` (or `run()` when input is `void`).

---

## ViewModel standard (canonical pattern)

All ViewModels in this project follow the same canonical pattern. Deviating from it is not allowed.

### Structure rules

1. `@injectable()` decorator + `makeAutoObservable(this)` in constructor.
2. State fields grouped by concern (one group per async call type).
3. A `private logger = new Logger('<ViewModelName>')` for consistent error logging.
4. A `type ICalls = 'callA' | 'callB'` union that names every async operation.
5. `private updateLoadingState(isLoading, error, type: ICalls)`: wraps all loading/error field assignments inside `runInAction` + a `switch` on `type`. **Never mutate loading/error fields directly** outside this method.
6. `private handleError(error: unknown, type: ICalls)`: formats the error message, calls `this.logger.error()`, then delegates to `updateLoadingState(false, message, type)`.
7. **All mutations after `await`** (i.e., setting domain data from the response) must be wrapped in `runInAction(() => { ... })`.
8. `reset()` must also wrap all field resets in `runInAction`.
9. ViewModel must expose explicit entrypoint methods for screen flows, e.g. `initialize(routeParam?)`, `submit(formValues)`, `consumeResult()`.
10. UI should not decide create-vs-update flow; VM handles operation mode and branching.

### ViewModel naming rules (mandatory)

- State names must be explicit by responsibility (preferred):
  - `isCreate<Entity>Loading / isCreate<Entity>Error / isCreate<Entity>Response`
  - `is<Entity>Loading / is<Entity>Error / is<Entity>Response`
  - `isUpdate<Entity>Loading / isUpdate<Entity>Error / isUpdate<Entity>Response`
- `ICalls` can remain operation-centered internally (e.g., `'loadBank'`, `'createBank'`, `'updateBank'`), but public VM state should prioritize direct readability.
- Prefer VM getters for UI hydration (e.g. `formValues`) to avoid mapping/transformation logic in screen code.

### Canonical ViewModel template

```ts
import { inject, injectable } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';

import { TYPES } from '@/config/types';
import { <Entity> } from '@/domain/entities/<Entity>';
import { GetAll<Entity>UseCase } from '@/domain/useCases/GetAll<Entity>UseCase';
import Logger from '@/ui/utils/Logger';

type ICalls = 'items' | 'create' | 'update' | 'delete';

@injectable()
export class <Feature>ViewModel {
  // ── State ─────────────────────────────────────────────────────────────────
  isItemsLoading: boolean = false;
  isItemsError: string | null = null;
  isItemsResponse: <Entity>[] | null = null;

  isSubmitting: boolean = false;
  isSubmitError: string | null = null;

  private logger = new Logger('<Feature>ViewModel');

  constructor(
    @inject(TYPES.GetAll<Entity>UseCase)
    private readonly getAll<Entity>UseCase: GetAll<Entity>UseCase,
  ) {
    makeAutoObservable(this);
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  get isLoaded(): boolean {
    return !this.isItemsLoading && this.isItemsResponse !== null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async loadAll(): Promise<void> {
    this.updateLoadingState(true, null, 'items');
    try {
      const response = await this.getAll<Entity>UseCase.run();
      runInAction(() => {
        this.isItemsResponse = response;
      });
      this.updateLoadingState(false, null, 'items');
    } catch (error) {
      this.handleError(error, 'items');
    }
  }

  async create(data: <Entity>): Promise<boolean> {
    this.updateLoadingState(true, null, 'create');
    try {
      await this.create<Entity>UseCase.run(data);
      this.updateLoadingState(false, null, 'create');
      return true;
    } catch (error) {
      this.handleError(error, 'create');
      return false;
    }
  }

  reset(): void {
    runInAction(() => {
      this.isItemsResponse = null;
      this.isItemsLoading = false;
      this.isItemsError = null;
      this.isSubmitting = false;
      this.isSubmitError = null;
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private updateLoadingState(isLoading: boolean, error: string | null, type: ICalls) {
    runInAction(() => {
      switch (type) {
        case 'items':
          this.isItemsLoading = isLoading;
          this.isItemsError = error;
          break;
        case 'create':
        case 'update':
        case 'delete':
          this.isSubmitting = isLoading;
          this.isSubmitError = error;
          break;
      }
    });
  }

  private handleError(error: unknown, type: ICalls) {
    const errorMessage = `Error in ${type}: ${
      error instanceof Error ? error.message : String(error)
    }`;
    this.logger.error(errorMessage);
    this.updateLoadingState(false, errorMessage, type);
  }
}
```

### Screen pattern (observer + container.get)

```tsx
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import { container } from '@/config/di';
import { TYPES } from '@/config/types';
import { <Feature>ViewModel } from './<Feature>ViewModel';

const <Feature>Screen = observer(() => {
  // VM instantiation — always useMemo with empty deps (transient scope)
  const viewModel = useMemo(
    () => container.get<<Feature>ViewModel>(TYPES.<Feature>ViewModel),
    [],
  );

  // Side effects (data loading) — always useEffect, never useMemo
  useEffect(() => {
    viewModel.loadAll();
  }, [viewModel]);

  // ...render
});
```

### Rules summary

| Rule                 | Correct                                 | Wrong                                            |
| -------------------- | --------------------------------------- | ------------------------------------------------ |
| Instantiate VM       | `useMemo(() => container.get(...), [])` | `new ViewModel()` in component body              |
| Trigger side effects | `useEffect(() => { vm.load() }, [vm])`  | `useMemo(() => { vm.load() }, [...])`            |
| Mutate after `await` | `runInAction(() => { this.x = val })`   | `this.x = val` directly after await              |
| Log + set error      | `handleError(e, type)`                  | Inline `this.error = e.message`                  |
| Set loading/error    | `updateLoadingState(bool, msg, type)`   | Direct field assignment scattered through action |

---

## DI checklist (must do)

1. Add `TYPES.<Feature>Service`
2. Add `TYPES.<Feature>Repository`
3. Add `TYPES.<UseCases...>`
4. Add `TYPES.<Feature>ViewModel` (if using DI retrieval)
5. Bind:
   - Service: singleton
   - RepoImpl: singleton
   - UseCases: transient
   - ViewModel: transient

## Lint + format setup (must do)

- Preserve and use current config files: `eslint.config.js`, `.prettierrc`, `.prettierignore`.
- Ensure `package.json` contains these scripts:
  - `lint`: `eslint .`
  - `lint:fix`: `eslint . --fix`
  - `format`: `prettier --write .`
  - `format:check`: `prettier --check .`
- Keep `eslint-config-prettier` in ESLint flat config to prevent collisions with Prettier output.
- Validate scaffold changes with `npm run lint` and `npm run format:check` before returning results.

---

## Unit testing requirements (must do)

- Test UseCases with `jest.fn()` mocks for repository contracts (no DI container in unit tests).
- Test ViewModel state transitions (`loading`, `error`, `items`) and action flows (`load`, `create`, `update`, `delete`).
- Cover happy path + at least one failure path per critical action.
- Keep tests deterministic: no Firebase/network calls, no real timers unless required.
- Verify interaction contracts (`toHaveBeenCalledWith`) between ViewModel → UseCase and UseCase → Repository.
- Use Jest repository standard (`jest-expo`), and run tests with `npm run test` / `npm run test:coverage`.
- Keep logs silent through global setup (`src/__test__/setupTests.ts`) instead of muting per-test ad hoc.
- Target at least **70% global coverage** after scaffold integration; prefer >80% when feature scope is bounded.
- When adding debounce/retry logic, use fake timers and stale-input branch tests.

### Coverage exclusions policy for scaffolded features

- Excluding pure runtime-noise files is acceptable (example: logger wrappers).
- Excluding pure contracts/interfaces is acceptable if they produce 0% noise with no executable logic.
- Do not exclude ViewModels, UseCases, repositories, services, or validators that contain business behavior.

### Minimum test checklist per scaffold

1. `GetAll<Feature>UseCase` success and error
2. `Create<Feature>UseCase` input handling and repository call
3. `<Feature>ViewModel.load()` updates `loading/items/error` correctly
4. One mutating action in ViewModel (`create`/`update`/`delete`) with success + failure
5. `<Feature>ViewModel` getters/computed and reset/consume result methods
6. `<Feature>Service` response unwrap + error normalization branches (if service exists)

---

## Output format (must follow)

Return:

1. A file-by-file plan (paths)
2. Code blocks per file (or diffs)
3. DI changes explicitly shown
4. Unit test files + test cases added
5. "How to test" steps (`npm test` and targeted test command)
