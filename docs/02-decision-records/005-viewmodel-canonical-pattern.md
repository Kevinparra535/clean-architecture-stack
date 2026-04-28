# ADR 005 — Patrón canónico del ViewModel

## Contexto

Cada ViewModel de la app maneja múltiples operaciones asíncronas (cargar lista, crear, actualizar, borrar, etc.). Cada operación tiene su propio estado de loading, error y respuesta. Sin un patrón fijo, esto se traduce en clases con 15-20 propiedades sueltas, mutaciones de estado dispersas por todos lados, y manejo de errores inconsistente entre VMs.

Los problemas concretos que veíamos sin patrón:

- **Mutaciones de loading/error después de `await`** sin envolver en `runInAction` (warnings de MobX).
- **Manejo de errores inconsistente**: algunas VMs guardan el `Error.message`, otras el `Error` completo, otras solo un boolean.
- **Falta de logging consistente** de errores en producción.
- **Imposibilidad de leer una VM** sin abrir 200 líneas para entender qué hace.
- **Code review difícil**: cada PR proponía una variación distinta del mismo patrón.

## Decisión

Adoptamos un **patrón canónico obligatorio** para todas las ViewModels de la app, con cinco elementos:

### 1. Tipo `ICalls` que enumera las operaciones

```ts
type ICalls = 'items' | 'create' | 'update' | 'delete';
```

### 2. Estado agrupado por concern, una propiedad por aspecto

```ts
isItemsLoading: boolean = false;
isItemsError: string | null = null;
isItemsResponse: Entity[] | null = null;

isSubmitting: boolean = false;
isSubmitError: string | null = null;
```

### 3. Logger privado

```ts
private logger = new Logger('FeatureViewModel');
```

### 4. Método privado `updateLoadingState`

```ts
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
```

### 5. Método privado `handleError`

```ts
private handleError(error: unknown, type: ICalls) {
  const message = error instanceof Error ? error.message : String(error);
  this.logger.error(`Error in ${type}: ${message}`);
  this.updateLoadingState(false, message, type);
}
```

Toda mutación de estado de loading/error pasa por `updateLoadingState`. Toda excepción capturada pasa por `handleError`. **Sin excepciones.**

## Alternativas consideradas

### A. Hooks personalizados (`useAsyncState`)

Estilo: cada acción es un hook que devuelve `{ data, loading, error, run }`. Composición vía hooks.

**Por qué no:**
- Choca con la decisión de tener VMs como clases inyectables (ADR 001).
- Disuelve el patrón de "una VM por pantalla" en N hooks dispersos.
- No funciona fuera de componentes (no puedes llamar a `vm.create(x)` desde `useEffect` y esperar resultado limpio).

### B. Una librería tipo `react-query`

**Por qué no para este caso:**
- React Query es excelente para caching de datos del servidor, pero no es un reemplazo de VM. Las VMs hacen mucho más que fetch (validación, derivación, orquestación).
- No queremos que la VM sea una abstracción sobre React Query: queremos que React Query (si lo usamos) viva _detrás_ del repositorio, invisible para la VM.

### C. Estado plano sin abstracciones (`isLoading: boolean` solo)

**Por qué no:**
- En cuanto la VM tiene 2+ operaciones simultáneas (cargar lista mientras creas un nuevo item), un solo flag de loading no alcanza.
- Tener flags ad-hoc dispersas (`isLoadingClients`, `isCreatingClient`, `creatingClientError`) sin patrón se vuelve un caos en VMs grandes.

### D. State machine (XState)

**Por qué no:**
- Excelente para flujos con muchos estados discretos (wizards, payment flows). Excesivo para CRUD estándar.
- Fricción de aprendizaje alta para el equipo.
- Lo dejamos disponible para casos puntuales donde la complejidad lo justifica, pero no como patrón por defecto.

## Por qué este patrón gana

1. **Reproducibilidad total.** Todas las VMs lucen igual. Onboarding y code review son inmediatos.
2. **`runInAction` está abstraído** dentro de `updateLoadingState`. El desarrollador no puede olvidar envolverlo.
3. **Logging consistente** en todos los errores. Los reportes de Sentry/Crashlytics tienen estructura predecible.
4. **Testeo predecible**: probar una VM se reduce a mockear UseCases y verificar estado en tres puntos (antes, durante, después).
5. **Tipo `ICalls` previene errores**: el `switch` exhaustivo te avisa si agregas una operación nueva y olvidas el caso.

## Consecuencias

### Ganamos
- Velocidad de onboarding altísima.
- Code review enfocado en lógica, no en estructura.
- Errores de mutación post-`await` desaparecen.
- Logs de errores uniformes.

### Cedemos
- **Boilerplate.** Una VM "trivial" requiere `ICalls`, `updateLoadingState`, `handleError` aunque solo tenga una operación. Aceptamos el costo.
- **Inflexibilidad.** Si una VM tiene un caso muy especial (ej: estado de drag-and-drop intermedio), forzarlo a este patrón puede ser raro. La salida es: agrega un caso al `ICalls` y al switch, no rompas el patrón.

## Reglas de aplicación obligatorias

1. **Toda mutación de loading/error pasa por `updateLoadingState`.** Cero excepciones.
2. **Todo `catch` llama a `handleError`.** Cero excepciones.
3. **Toda mutación de datos del dominio post-`await` se envuelve en `runInAction`.**
4. **Las VMs son `@injectable`** y usan `makeAutoObservable(this)` en el constructor.
5. **Los nombres de estado son explícitos por responsabilidad** (`isCreateClientLoading`, no `loading2`).

## Cuándo reconsiderar

- Si descubrimos que el patrón no escala a un caso específico recurrente (ej: streams realtime), evaluamos una variante documentada para ese caso, no abandono total.
- Si MobX cambia su API de forma que `runInAction` deja de existir, adaptamos `updateLoadingState` a la nueva API. El patrón abstracto sobrevive.

## Referencias

- Plantilla completa en [`examples/viewmodel-canonical.ts`](../../examples/viewmodel-canonical.ts).
- Skill que aplica este patrón: [`feature-scaffold-rn.md`](../../skills/react-native/feature-scaffold-rn.md).
- Esta es la decisión más copiada y aplicada de toda la arquitectura. Si solo lees un ADR, lee este.
