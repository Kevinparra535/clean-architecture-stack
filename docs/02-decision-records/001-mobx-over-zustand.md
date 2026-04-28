# ADR 001 — MobX over Zustand (y Redux Toolkit)

## Contexto

El estado de cliente en React tiene varias soluciones maduras en 2026: Zustand, Jotai, Redux Toolkit, MobX, Valtio, Signal-based libraries. Necesitamos elegir una y comprometernos con ella, porque el patrón de ViewModel + capas que adoptamos no funciona igual con todas.

Las dos finalistas fueron **MobX** y **Zustand**. Redux Toolkit quedó descartado por su verbosidad y porque su modelo (acciones serializables, reducers puros) no encaja con la idea de una clase ViewModel mutable.

## Decisión

**Elegimos MobX**, específicamente con la API de `makeAutoObservable(this)` invocada en el constructor de la ViewModel.

## Alternativas consideradas

### Zustand

**A favor:**
- API minimalista, curva de aprendizaje baja.
- Excelente integración con hooks de React.
- Bundle pequeño (~1.2KB).
- Comunidad creciente, ecosistema rico.

**En contra:**
- Empuja a un estilo funcional/hooks que rompe el patrón de "ViewModel como clase".
- Las acciones que requieren estado privado son verbose (tienes que armar closures o usar `getState`).
- El equivalente de `runInAction` después de un `await` se siente forzado en Zustand.
- Inyectar dependencias en un store de Zustand (para que llame UseCases) requiere tricks que rompen la simplicidad que vende la librería.

### Redux Toolkit

- Demasiado boilerplate para apps no-corporativas.
- El requisito de acciones serializables es incompatible con UseCases que retornan instancias de clases del dominio.

### Jotai / Valtio / Signals

- Buenos para estado atómico/derivado, pero no son una buena base para "ViewModels con métodos y estado privado". Harían que la arquitectura se sienta forzada.

## Por qué MobX gana en este contexto

1. **VM-as-class es nativo.** `class FeatureViewModel { ... }` con `makeAutoObservable(this)` es _exactamente_ lo que MobX está diseñado para soportar. Cero adaptación, cero workarounds.

2. **Compatibilidad perfecta con Inversify.** Inversify inyecta clases en clases. MobX hace clases reactivas. Las dos cosas se combinan sin fricción.

3. **`runInAction` es explícito y enseñable.** La regla "después de un `await`, envuelve la mutación" es fácil de transmitir y de revisar en code review. En Zustand, las "buenas prácticas" para lo mismo son menos universales.

4. **Reactividad granular sin esfuerzo.** Los componentes envueltos con `observer` solo se re-renderizan si las propiedades específicas que leen cambian. No hay que pensar en selectores ni `useShallow`.

5. **Reactions y computed son potentes.** Para autosave con debounce, derivaciones complejas, sincronización entre VMs — `reaction(...)` y `computed` son herramientas más expresivas que sus equivalentes en Zustand.

## Consecuencias

### Ganamos
- Patrón de ViewModel canónico estable y reproducible.
- Cero ceremonia en estado mutable controlado.
- Compatibilidad con clases de DI sin hacks.
- Reactividad granular sin selectores manuales.

### Cedemos
- Estamos fuera del consenso "moderno" del ecosistema React (que apunta a Zustand y server components).
- Los nuevos miembros del equipo que vienen de Zustand/Redux necesitan una sesión de onboarding sobre `makeAutoObservable`, `runInAction` y `observer`.
- Bundle ~22KB (vs ~1.2KB de Zustand). En apps donde tamaño de bundle es crítico, esto puede ser un argumento en contra.
- Si MobX deprecara features clave en el futuro, una migración sería considerable.

### Lo que NO cedemos
- No cedemos performance: MobX es competitivo o mejor que Zustand en escenarios complejos por su reactividad granular.
- No cedemos testability: probar una VM con MobX es trivial (instancias planas, `jest.fn()` para deps).
- No cedemos modernidad real: MobX sigue activamente mantenido, no es legacy.

## Cuándo reconsiderar esta decisión

- Si el equipo va a estar dominado por desarrolladores con experiencia funcional/hooks y la curva de MobX se vuelve un cuello de botella.
- Si el producto se mueve a un modelo dominado por server components, donde el estado de cliente se reduce a islas pequeñas.
- Si MobX introduce cambios breaking importantes que comprometen el patrón de VM-as-class.

Ninguna de esas condiciones aplica hoy. Esta decisión se mantiene.

## Referencias

- Documentación oficial de MobX 6: https://mobx.js.org/
- Comparativa de bundle sizes: https://bundlephobia.com/
- Discusión en HN sobre estado en React (varios hilos relevantes 2024-2026).
