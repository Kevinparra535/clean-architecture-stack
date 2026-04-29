# ADR 002 — Inversify over React Context (y factories)

## Contexto

Esta arquitectura modela ViewModels, UseCases, Repositories y Services como **clases con dependencias entre sí**. Una `ClientsViewModel` depende de varios `UseCase`, que dependen de un `Repository`, que depende de un `Service`. Para que todo eso se conecte sin acoplamiento, necesitamos una estrategia de inyección de dependencias.

Las opciones evaluadas fueron tres: **Inversify** (DI container con decoradores), **React Context** (uso del propio React), y **factories manuales** (composición sin librería).

## Decisión

**Elegimos Inversify** con el patrón `@injectable()` + `@inject(TYPES.X)` y un `container` único declarado en `src/config/di.ts`.

## Alternativas consideradas

### A. React Context

**A favor:**
- Es nativo de React, sin dependencias extra.
- Los nuevos miembros del equipo ya lo conocen.

**En contra:**
- **Está acoplado al árbol de componentes.** Si una VM necesita acceder a un UseCase, tiene que estar dentro del árbol que tiene el Provider correspondiente. Eso filtra preocupaciones de UI a las clases del dominio.
- **No funciona fuera de componentes.** No puedes resolver dependencias en un script, en un test sin renderizar, ni en código que se ejecuta antes del primer render.
- **Resolver una dependencia requiere `useContext`**, que es un hook. No puedes consumirlo desde una clase.
- **Scoping de instancias es manual.** Singleton vs transient se logra con tricks (memoización, providers anidados), no con una API declarativa.
- **El grafo de dependencias está implícito**, distribuido entre los providers en el árbol de componentes. Esto se vuelve ilegible cuando el grafo crece.

### B. Factories manuales

**A favor:**
- Cero dependencias.
- Máxima transparencia: cada `new` es visible.

**En contra:**
- **Pierde las garantías de DI.** Cada lugar que necesita una `ClientsViewModel` tiene que conocer todas sus dependencias y construirlas. Cambiar la firma del constructor implica tocar N callsites.
- **El cambio de implementación se vuelve ceremonioso.** Pasar de `FirebaseClientService` a `RestClientService` requiere editar muchos archivos.
- **Singletons son responsabilidad del que llama.** Olvidarse y crear dos instancias de un Service compartido es un bug silencioso.

## Por qué Inversify gana en este contexto

1. **Las clases declaran lo que necesitan, no cómo obtenerlo.** El constructor de `ClientsViewModel` recibe `GetAllClientUseCase` por inyección; no sabe ni le importa cómo se construye.
2. **El grafo de dependencias está en un solo archivo.** `src/config/di.ts` es la fotografía completa del sistema. Para entender qué depende de qué, abres un archivo.
3. **Lifetime declarativo.** `inSingletonScope()` vs transient es una llamada de un método, no un patrón aplicado a mano.
4. **Composición fuera de componentes.** Tests, scripts CLI, server-side rendering, todos pueden resolver dependencias sin necesidad de un árbol React.
5. **Compatibilidad con MobX.** Como la VM es una clase con `makeAutoObservable`, instanciarla con Inversify es trivial. Inversify y MobX son ortogonales y se combinan sin fricción.
6. **Reemplazo de implementaciones.** Cambiar de Firebase a REST es cambiar una línea en `di.ts`. Los consumidores no se enteran.

## Consecuencias

### Ganamos
- Acoplamiento mínimo entre capas.
- Tests sin levantar contenedor: instancias mock se inyectan a mano (`new VM(mockUseCase)`).
- Código que vive fuera de React (background tasks, scripts) puede resolver dependencias.
- Refactors locales: cambiar una implementación no propaga cambios.

### Cedemos
- **Decoradores experimentales.** Necesitamos `experimentalDecorators` y `emitDecoratorMetadata` en `tsconfig.json`, más `reflect-metadata` importado al inicio. Es una configuración inicial que hay que hacer una vez.
- **Curva de aprendizaje.** Los desarrolladores que vienen de un mundo sin DI necesitan aprender el patrón. No es difícil, pero no es gratis.
- **Bundle.** Inversify pesa ~10KB. Para apps móviles esto rara vez es relevante; para web ultra-optimizada puede serlo.
- **Una dependencia más.** Si Inversify desapareciera mañana, una migración sería trabajo (manejable, pero trabajo).

## Reglas de aplicación

1. **Toda clase inyectable lleva `@injectable()`.** Sin excepciones.
2. **Todas las dependencias del constructor llevan `@inject(TYPES.X)`.** Sin excepciones.
3. **`TYPES` es un único objeto en `src/config/types.ts`** con símbolos consistentes.
4. **Bindings viven en un único `src/config/di.ts`.** Si crece demasiado, se divide por dominio (`di.clients.ts`, `di.banks.ts`) pero se compone en uno solo.
5. **Servicios y RepositoryImpl: singleton.** UseCases y ViewModels: transient.
6. **Los tests NO usan `container.get`.** Instancian VMs y UseCases directamente con mocks. Eso es DI usado correctamente.

## Cuándo reconsiderar

- Si Inversify deprecara funcionalidad clave o dejara de mantenerse, evaluar `tsyringe` o `awilix` como reemplazos compatibles.
- Si la app se va a un modelo dominado por server components donde la mayor parte del estado vive en el servidor, el peso de Inversify puede no justificarse para una superficie cliente reducida.
- Si el equipo se vuelve mayoritariamente junior sin acompañamiento, la curva inicial puede ser cuello de botella; en ese caso, una variante con factories explícitas puede ser más manejable.

Ninguna de esas condiciones aplica hoy. Esta decisión se mantiene.

## Referencias

- Inversify oficial: https://inversify.io/
- Patrón de DI en TypeScript: https://www.typescriptlang.org/docs/handbook/decorators.html
- Discusión sobre alternativas: tsyringe, awilix, typedi (todas viables; Inversify ganó por madurez y comunidad).
