# Clean Architecture Stack

> Una arquitectura opinada y consistente para construir apps React, React Native y librerías npm mantenibles, basada en **MVVM + MobX + Inversify + Clean Architecture**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-fase%201-blue)](./ROADMAP.md)

---

## ¿Qué es esto?

Este repositorio es la documentación de una arquitectura que he venido refinando en proyectos React y React Native. No es un framework, no es un paquete npm, no es un boilerplate. Es **un conjunto de reglas, convenciones y plantillas** que cualquier desarrollador (o LLM, ver más abajo) puede leer y aplicar para escribir código mantenible, testeable y consistente.

Encontrarás aquí:

- **Skills** (`skills/`) — archivos `.md` con instrucciones precisas, diseñados para que tanto humanos como asistentes de IA (Claude, Cursor, Copilot) los consuman y generen código que cumpla las reglas.
- **ADRs** (`docs/02-decision-records/`) — registros de decisiones de arquitectura que explican el "por qué" detrás de cada elección.
- **Ejemplos** (`examples/`) — snippets canónicos de cada pieza (ViewModel, UseCase, Entity, Repository, DI bindings).
- **Diagramas** (`diagrams/`) — representaciones visuales de la arquitectura.

## ¿Por qué otra arquitectura?

El ecosistema React de 2026 está dominado por hooks, Zustand/Jotai, server components y patrones funcionales. Son excelentes para muchos casos. Esta arquitectura **no compite con ellos en su terreno**: compite cuando:

- El dominio del negocio es **rico** (no eres un wrapper de un CRUD).
- El equipo es **mediano o grande** (3+ desarrolladores).
- El código va a **vivir años** y va a ser tocado por gente que no estuvo en su diseño original.
- Quieres que **agregar una feature siempre se sienta igual**, sin importar quién la escriba.

En esos contextos, la disciplina de capas + DI + ViewModels rinde mucho más que un montón de hooks compartidos. Si tu app es un dashboard de 5 pantallas con 2 endpoints, esto es overkill — usa Zustand y sigue tu camino.

## Cuándo SÍ usar esto / Cuándo NO

| Úsalo cuando…                                              | Evítalo cuando…                                         |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| Tu app tiene reglas de negocio no triviales                | Es un sitio mayormente estático o de marketing          |
| Vas a tener múltiples fuentes de datos (REST, GraphQL, FB) | Tienes un solo endpoint y nada más                      |
| El equipo crece y necesitas onboarding predecible          | Estás solo y vas a quedarte solo                        |
| Quieres testear lógica sin levantar la UI                  | El código es desechable o un prototipo                  |
| Necesitas reemplazar el backend sin tocar la UI            | El backend es estable y nunca va a cambiar              |
| Vas a tener varios productos compartiendo dominio          | Es una app one-shot                                     |

Más detalle en [`docs/04-when-not-to-use.md`](./docs/04-when-not-to-use.md).

## Tour rápido (5 min)

Vamos a ver el flujo completo de **"agregar un cliente"**, de la pantalla hasta la API.

### 1. La pantalla solo bindea inputs y llama a la VM

```tsx
// src/ui/screens/Clients/ClientsScreen.tsx
const ClientsScreen = observer(() => {
  const vm = useMemo(
    () => container.get<ClientsViewModel>(TYPES.ClientsViewModel),
    [],
  );

  useEffect(() => { vm.loadAll(); }, [vm]);

  return (
    <SafeAreaView>
      {vm.isClientsLoading && <Spinner />}
      {vm.isClientsError && <Text>{vm.isClientsError}</Text>}
      <FlatList data={vm.isClientsResponse} ... />
      <PrimaryButton label="Agregar" onPress={() => vm.create(formValues)} />
    </SafeAreaView>
  );
});
```

### 2. La ViewModel orquesta estado y delega en UseCases

```ts
// src/ui/screens/Clients/ClientsViewModel.ts
@injectable()
export class ClientsViewModel {
  isClientsLoading = false;
  isClientsError: string | null = null;
  isClientsResponse: Client[] | null = null;

  constructor(
    @inject(TYPES.GetAllClientUseCase) private getAll: GetAllClientUseCase,
    @inject(TYPES.CreateClientUseCase) private createUC: CreateClientUseCase,
  ) {
    makeAutoObservable(this);
  }

  async loadAll() {
    this.updateLoadingState(true, null, 'items');
    try {
      const response = await this.getAll.run();
      runInAction(() => { this.isClientsResponse = response; });
      this.updateLoadingState(false, null, 'items');
    } catch (e) { this.handleError(e, 'items'); }
  }

  // ... updateLoadingState, handleError, create, etc.
}
```

### 3. El UseCase ejecuta UNA acción de negocio

```ts
// src/domain/useCases/GetAllClientUseCase/index.ts
@injectable()
export class GetAllClientUseCase implements UseCase<void, Client[]> {
  constructor(
    @inject(TYPES.ClientRepository) private repo: ClientRepository,
  ) {}

  async run(): Promise<Client[]> {
    return this.repo.getAll();
  }
}
```

### 4. La interfaz del repositorio vive en `domain/`

```ts
// src/domain/repositories/ClientRepository.ts
export interface ClientRepository {
  getAll(): Promise<Client[]>;
  create(client: Client): Promise<Client>;
  // ...
}
```

### 5. La implementación vive en `data/` y mapea modelos a entidades

```ts
// src/data/repositories/ClientRepositoryImpl.ts
@injectable()
export class ClientRepositoryImpl implements ClientRepository {
  constructor(
    @inject(TYPES.ClientService) private service: ClientService,
  ) {}

  async getAll(): Promise<Client[]> {
    const models = await this.service.fetchAll();
    return models.map(m => m.toDomain());
  }
}
```

**Eso es todo.** Cualquier feature nueva sigue ese mismo flujo, escrito por cualquier persona del equipo, queda igual. Esa es la promesa.

Ver el flujo completo de archivos en [`examples/`](./examples/).

## Las reglas no negociables

1. **UI depende solo del ViewModel.** No importa `data/`, no importa Firebase, no importa axios.
2. **ViewModel depende solo de UseCases.** No conoce repositorios.
3. **UseCases dependen solo de contratos del dominio** (interfaces).
4. **`domain/` no importa nada de framework ni infraestructura.** Es portable.
5. **Cada acción de negocio = un UseCase.** Uno solo, en su propia carpeta.
6. **Los modelos de transporte (DTOs) nunca llegan a la UI.** Siempre mapeados a entidades del dominio.
7. **Las ViewModels son UI-agnósticas.** No tienen `Alert`, ni `navigate`, ni hooks, ni `window`.

## Stack y decisiones

| Pieza               | Elección                            | Alternativa rechazada     | ADR                                                                                  |
| ------------------- | ----------------------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| Estado              | MobX (`makeAutoObservable`)         | Zustand, Redux Toolkit    | [001](./docs/02-decision-records/001-mobx-over-zustand.md)                          |
| Inyección           | Inversify (`@injectable` + `TYPES`) | React Context, factories  | [002](./docs/02-decision-records/002-inversify-over-context.md)                     |
| Entidades           | Clases con `[key: string]: any`     | Interfaces puras          | [003](./docs/02-decision-records/003-class-entities-with-index-signature.md)        |
| Granularidad VM→UC  | 1 acción = 1 UseCase                | Service con N métodos     | [004](./docs/02-decision-records/004-one-usecase-per-action.md)                     |
| Patrón ViewModel    | `ICalls` + `updateLoadingState`     | `useState` por flag       | [005](./docs/02-decision-records/005-viewmodel-canonical-pattern.md)                |

## Cómo aplicarlo a tu proyecto

1. Lee este README completo.
2. Revisa el [Tour rápido](#tour-rápido-5-min) y los [ejemplos canónicos](./examples/).
3. Consulta la skill que aplica a tu plataforma:
   - React Native (Expo): [`skills/react-native/`](./skills/react-native/)
   - React web: _en Fase 2_
   - npm package: _en Fase 2_
4. Para cada feature nueva, sigue el [PR Checklist](./skills/react-native/pr-checklist-clean-architecture.md).

Más detalle en [`docs/01-getting-started.md`](./docs/01-getting-started.md).

## Las skills (uso con LLMs)

Las skills en `skills/` no son documentación pasiva. Están escritas como **instrucciones ejecutables** para asistentes de IA: si pegas el contenido de `feature-scaffold-rn.md` en Claude Projects, Cursor Rules, o un system prompt, el LLM va a generar features que cumplen estas reglas sin que tengas que repetirlas en cada prompt.

| Skill                                                                                              | Propósito                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [clean-architecture-rn-expo-mvvm](./skills/react-native/clean-architecture-rn-expo-mvvm.md)        | Reglas generales de arquitectura (RN Expo)             |
| [feature-scaffold-rn](./skills/react-native/feature-scaffold-rn.md)                                | Scaffold completo de una feature vertical              |
| [design-system-rn](./skills/react-native/design-system-rn.md)                                      | Tokens y componentes del design system                 |
| [pr-checklist-clean-architecture](./skills/react-native/pr-checklist-clean-architecture.md)        | Checklist para revisar PRs                             |

## FAQ rápido

**¿Por qué MobX en 2026?** Porque `makeAutoObservable` + clases es el match perfecto para MVVM y la VM-as-class. Zustand es excelente, pero te empuja a un estilo funcional/hooks que choca con la disciplina de capas que buscamos. Detalle en [ADR 001](./docs/02-decision-records/001-mobx-over-zustand.md).

**¿Inversify no es exagerado para React?** Para una app pequeña, sí. Para apps con 20+ pantallas, decenas de UseCases y múltiples adaptadores de datos, Inversify se paga solo. Detalle en [ADR 002](./docs/02-decision-records/002-inversify-over-context.md).

**¿Por qué `[key: string]: any` en entidades?** Es una concesión consciente: privilegia velocidad de iteración con backends inestables sobre tipado exhaustivo. Detalle en [ADR 003](./docs/02-decision-records/003-class-entities-with-index-signature.md).

**¿"1 acción = 1 UseCase" no genera explosión de archivos?** En apps puramente CRUD, sí. En apps con dominio rico, esa explosión es _exactamente_ lo que da claridad. Detalle en [ADR 004](./docs/02-decision-records/004-one-usecase-per-action.md).

Más en [`docs/03-faq.md`](./docs/03-faq.md).

## Roadmap

- ✅ **Fase 1** — Skills RN + docs base + ADRs principales (este release)
- 🚧 **Fase 2** — Skills React web + monorepo/npm package
- 🔭 **Fase 3** — Skills Python (FastAPI + hexagonal)
- 🔭 **Fase 4** — CLI generador de features (`npx cas-cli new-feature Clients`)

Detalle en [`ROADMAP.md`](./ROADMAP.md).

## Contribuir

Las skills evolucionan con el uso real. Si encuentras un caso que no cubren, una regla que choca con tu contexto, o un patrón mejor: abre un issue o PR. Ver [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Licencia

MIT — ver [`LICENSE`](./LICENSE).

---

_Escrito por [@&lt;kevinparra535&gt;](https://github.com/&lt;kevinparra535&gt;). Si esto te ayudó, deja una estrella ⭐ en el repo._
