# ADR 004 — Una acción de negocio = un UseCase

## Contexto

La capa de dominio modela las acciones de negocio. Tenemos dos formas razonables de organizarlas:

- **Servicios con N métodos:** un único `ClientService` con `getAll()`, `getOne()`, `create()`, `update()`, `delete()`, `archive()`, `transferOwnership()`, etc.
- **UseCases atómicos:** una clase por acción — `GetAllClientUseCase`, `CreateClientUseCase`, `ArchiveClientUseCase`, `TransferClientOwnershipUseCase`, cada una en su propia carpeta.

Ambas funcionan. Pero solo una **escala bien** cuando la app crece y la lógica de negocio se vuelve no trivial.

## Decisión

**Adoptamos UseCases atómicos:** una acción de negocio = una clase = una carpeta = un `index.ts`.

```
src/domain/useCases/
├── UseCase.ts                          ← interfaz base
├── GetAllClientUseCase/
│   └── index.ts
├── CreateClientUseCase/
│   └── index.ts
├── ArchiveClientUseCase/
│   └── index.ts
└── TransferClientOwnershipUseCase/
    └── index.ts
```

Cada UseCase implementa `UseCase<Input, Output>` y expone un único método `run(data)`.

## Alternativas consideradas

### A. Servicios con N métodos

**A favor:**
- Menos archivos.
- Menos bindings en DI.
- Ergonomía superficial para CRUDs puros.

**En contra:**
- **Mezcla N responsabilidades en una clase.** Un `ClientService` con 8 métodos no tiene "una sola razón para cambiar" — tiene ocho.
- **Crece sin freno.** Cuando aparece un nuevo método (`mergeWithCorporate()`), nadie lo cuestiona porque ya hay otros 8. El service se vuelve un cajón de sastre.
- **Tests acoplados.** Cada método tiene su propio setup. Los tests del service son spaghetti porque para probar `transferOwnership` mockeas dependencias que `getAll` no necesita, y viceversa.
- **Dependencias infladas.** El constructor del service termina inyectando todas las dependencias que cualquier método pueda necesitar. Mockear se vuelve costoso.
- **Difícil de descubrir.** "¿Dónde se hace la transferencia de cliente?" — toca abrir el service y leer 8 métodos.

### B. UseCases solo para acciones complejas, services para CRUD

**A favor:**
- Compromiso aparente: "no inflamos archivos en CRUDs simples".

**En contra:**
- **Inconsistencia.** El equipo tiene que decidir cada vez si una acción es "lo bastante compleja" para merecer su propio UseCase. Esa decisión es subjetiva y se vuelve discusión recurrente.
- **Asimetría que confunde.** Para un dev nuevo, "a veces hay UseCase, a veces hay service" es ruido cognitivo. La consistencia vale más que la elegancia local.
- **El mejor momento para crear el UseCase es ANTES de necesitarlo.** Cuando aparece la primera regla de negocio, ya tienes el archivo donde ponerla. Diferirlo significa refactor.

## Por qué UseCases atómicos ganan en este contexto

1. **Single Responsibility real.** Cada UseCase falla por una sola razón. Si `CreateClientUseCase` rompe, sabes qué se rompió.
2. **Descubribilidad por nombre.** `TransferClientOwnershipUseCase` te dice exactamente qué hace antes de abrirlo. `ClientService.transferOwnership` te dice lo mismo, pero el primero es el archivo entero.
3. **Tests aislados.** Probar `CreateClientUseCase` requiere mockear solo lo que esa acción usa. El resto del dominio no entra en escena.
4. **Composición clara.** Si `ArchiveClientUseCase` necesita primero `GetClientUseCase` para validar, eso queda explícito en el constructor. En un service, esa relación es interna y oculta.
5. **Open/Closed.** Agregar una nueva acción no toca código existente. Solo agregas un archivo y un binding.
6. **Granularidad para reutilización.** Un UseCase se reutiliza en múltiples ViewModels limpiamente. Un método de service requiere arrastrar todo el service como dependencia.

## Consecuencias

### Ganamos
- Cohesión y SRP rigurosos.
- Tests de granularidad fina, fáciles de escribir y mantener.
- Onboarding rápido: la estructura se entiende leyendo nombres de carpetas.
- Refactors locales: tocar un UseCase no afecta a los demás.

### Cedemos
- **Explosión de archivos en apps CRUD.** Una app con 15 entidades y 5 acciones cada una genera 75 carpetas de UseCases. Aceptamos el costo. Sí, son muchos archivos. Sí, vale la pena.
- **Más bindings en DI.** Cada UseCase necesita su `TYPES` y su binding. Es boilerplate, pero predecible y mecánico (la skill `feature-scaffold-rn` lo automatiza).
- **Para casos triviales, el UseCase es un wrapper de una línea.** `run() { return this.repo.getAll(); }`. Ese costo es real y deliberado: el archivo está listo para cuando aparezca la primera regla.

### Lo que NO cedemos
- No cedemos performance (el wrapper es nada en runtime).
- No cedemos legibilidad (al contrario: ganamos descubribilidad).
- No cedemos extensibilidad (es exactamente el caso de uso de esta granularidad).

## Reglas de aplicación

1. **Cada UseCase vive en su propia carpeta** `src/domain/useCases/<UseCaseName>/index.ts`.
2. **Cada UseCase implementa `UseCase<Input, Output>`** desde `src/domain/useCases/UseCase.ts`.
3. **El método público se llama `run`.** No `execute`, no `handle`, no `do`. `run`.
4. **Si el UseCase no tiene input, `Input` es `void`** y `run()` no recibe argumentos.
5. **Un UseCase no llama a otro UseCase directamente.** Si necesita orquestar, esa orquestación va en la VM. Los UseCases son hojas del árbol de dominio.
6. **Un UseCase puede tener múltiples dependencias** (repositorios, otros services del dominio). No tiene que ser un wrapper trivial.

## Cuándo reconsiderar

- **Si la app es 100% CRUD puro** y no tiene ni una sola regla de negocio (y sabes que nunca la tendrá), considera consolidar en services. Pero pregúntate dos veces si _de verdad_ no va a tener lógica.
- **Si el equipo bloquea features porque "hay que crear muchos archivos"**, evalúa si el problema es la regla o la herramienta. Una skill de scaffolding o un CLI generador (Fase 4 del roadmap) elimina ese costo.

## Cuando un UseCase deja de ser un wrapper trivial

Este es el momento exacto donde la regla **paga lo que cuesta**. Un ejemplo:

```ts
@injectable()
export class TransferFundsUseCase
  implements UseCase<{ fromId: string; toId: string; amount: number }, void>
{
  constructor(
    @inject(TYPES.AccountRepository) private accountRepo: AccountRepository,
    @inject(TYPES.TransactionRepository) private txRepo: TransactionRepository,
  ) {}

  async run({ fromId, toId, amount }) {
    if (amount <= 0) throw new Error('Amount must be positive');

    const from = await this.accountRepo.getById(fromId);
    if (from.balance < amount) throw new Error('Insufficient funds');

    await this.accountRepo.updateBalance(fromId, from.balance - amount);
    const to = await this.accountRepo.getById(toId);
    await this.accountRepo.updateBalance(toId, to.balance + amount);
    await this.txRepo.record({ fromId, toId, amount, at: new Date() });
  }
}
```

Esta acción tiene validación, secuencia, dos repositorios, manejo de errores. **Es exactamente el caso de uso para esta granularidad.** Ponerlo en un `AccountService.transferFunds(...)` mezclaría su complejidad con métodos triviales como `getById` y haría el service ilegible.

## Referencias

- Plantilla: [`examples/usecase-canonical.ts`](../../examples/usecase-canonical.ts)
- Skill que aplica esta regla automáticamente: [`feature-scaffold-rn.md`](../../skills/react-native/feature-scaffold-rn.md)
- Inspiración conceptual: Use Cases en Clean Architecture (Uncle Bob), Application Services en DDD (Evans).
