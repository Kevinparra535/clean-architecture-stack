# 03 — FAQ

Las objeciones más frecuentes a esta arquitectura, respondidas con honestidad.

## "¿MobX en 2026? ¿En serio?"

Sí. Tres razones:

1. **MVVM con clases es el match natural de MobX.** `makeAutoObservable(this)` en el constructor convierte una clase regular en un store reactivo sin boilerplate. Zustand y Jotai están diseñados para un estilo más funcional/hooks que choca con la disciplina de capas que buscamos.
2. **El patrón canónico del ViewModel** (con `ICalls`, `updateLoadingState`, `handleError`) requiere métodos privados, estado mutable controlado y `runInAction`. MobX modela esto sin fricción; intentarlo en Zustand resulta verbose o forzado.
3. **MobX está mantenido y estable**. La última major (6.x) lleva años en producción, no hay deprecaciones a la vista, y el ecosistema es predecible.

¿Es la moda? No. ¿Es la mejor herramienta para este patrón específico? Sí. Detalle completo en [ADR 001](./02-decision-records/001-mobx-over-zustand.md).

## "¿Inversify no es enterprise-grade overkill para una app móvil?"

Para una app de 5 pantallas, sí. Para una app con 30 pantallas, decenas de UseCases, varios servicios y tests unitarios serios, no.

Inversify resuelve tres cosas que **vas a necesitar** en apps medianas:

- **Tests sin acoplamiento**: instancias mock se inyectan sin tocar el código de producción.
- **Reemplazo de implementaciones**: cambiar de Firebase a REST se hace cambiando un binding, no editando 40 archivos.
- **Composición predecible**: el grafo de dependencias está declarado en un solo lugar (`di.ts`).

Hay alternativas más simples (factories, contexto), pero ninguna escala tan limpiamente. Detalle en ADR 002 (Fase 2).

## "¿Por qué `[key: string]: any` en las entidades? ¡Eso mata TypeScript!"

Es la concesión más cuestionable del stack y lo asumimos. La razón:

- Los backends reales **agregan campos sin avisar**. Si tu entidad está estrictamente tipada, cualquier campo nuevo del backend es un error de TS hasta que lo tipes manualmente.
- En etapas tempranas de un producto, **iterar es más importante que tipar exhaustivamente**. El `[key: string]: any` te deja consumir el campo nuevo el mismo día que el backend lo expone.
- **Los campos críticos sí están tipados**: `id`, `name`, fechas, etc. El `any` es solo para el resto.

¿Es ideal? No. ¿Es pragmático? Sí. Si tu backend es estable y completamente versionado, considera quitar el `[key: string]: any` y tipar todo. Detalle en ADR 003 (Fase 2).

## "¿'Una acción = un UseCase' no es una explosión de archivos?"

Lo es. Y es deliberado.

- Un UseCase es **descubrible por nombre**. `CreateClientUseCase` te dice exactamente qué hace antes de abrirlo.
- Un UseCase es **testeable en aislamiento total** sin levantar nada.
- Un UseCase **falla por una sola razón** (si rompe, sabes qué se rompió).

La alternativa común es un `ClientService` con `getAll()`, `getOne()`, `create()`, `update()`, `delete()`. Eso da menos archivos pero:

- Mezcla 5 responsabilidades en una clase.
- Cuando crece, mezcla 15.
- Los tests del service son spaghetti porque cada método tiene su propio setup.

Si tu app es CRUD puro y nunca va a tener lógica de negocio compleja, esta regla es excesiva. Para todo lo demás, los archivos extra valen la pena. Detalle en ADR 004 (Fase 2).

## "¿`runInAction` después de cada `await`? Eso es feo."

Es feo y es necesario. MobX en modo estricto requiere que toda mutación de estado pase por una "action". Después de un `await`, ya no estás en la action original — estás en un microtask nuevo. Si mutas estado ahí sin envolver en `runInAction`, MobX te grita (y con razón).

Hay alternativas (`flow` con generators, `action.bound`), pero `runInAction` es el más explícito y el más fácil de leer en code review. La fealdad es el costo de la disciplina; preferimos pagarlo a confundirnos con magic.

## "Los ViewModels parecen Angular Services. ¿No estás reinventando Angular?"

En cierta medida, sí. La separación View/ViewModel/Service viene de WPF (Microsoft, 2005) y Angular la heredó. React originalmente apostó por una visión distinta (componentes funcionales + estado local), y muchas codebases React siguen siendo así.

Para apps simples, el approach React-puro es mejor: menos archivos, menos abstracciones, suficiente. Para apps con dominio rico, **el approach de Angular/WPF gana**: la separación de capas es más sostenible que el caos de hooks personalizados que nadie sabe dónde viven.

Esta arquitectura es básicamente: "tomemos lo bueno de Angular (DI, ViewModels, capas) y lo bueno de React (renderizado declarativo, ecosistema, RN)". El precio es que dejamos de ser "idiomáticos React".

## "¿Esto funciona con Server Components / Next.js App Router?"

Parcialmente. Esta arquitectura asume **estado de cliente no trivial**, que es contrario al modelo de Server Components donde la mayor parte del estado vive en el servidor.

- Si tu app es **SPA tradicional** (CRA, Vite, Expo): aplica al 100%.
- Si es **Next.js Pages Router**: aplica con leves adaptaciones.
- Si es **Next.js App Router con muchos Server Components**: aplica solo en las "islas cliente"; gran parte de la lógica vive en server actions y route handlers, donde MobX no entra.

La skill de React web cubre el caso SPA. Para App Router no hay skill aún (Fase 2 / 3).

## "¿No me ata mucho a estas decisiones?"

Sí. Es el costo. A cambio:

- Onboarding predecible.
- Tests fáciles de escribir.
- Refactors locales (cambias una capa sin tocar las otras).
- Posibilidad de reemplazar piezas (backend, UI library) sin reescribir el dominio.

Si valoras más la flexibilidad inmediata que la consistencia a largo plazo, este stack no es para ti. Y está bien.

## "¿Por qué publicar esto si ya hay 100 guías de Clean Architecture en GitHub?"

Tres razones:

1. **La mayoría son teóricas o en idiomas distintos**. Esta es validada en proyectos reales y está en español + inglés.
2. **Las skills son ejecutables por LLMs**. Eso sí es nuevo: no es solo documentación, es un input para asistentes de IA que generan código consistente.
3. **Es opinada de verdad**. La mayoría de "guías" presentan 4 alternativas y te dicen "depende". Esta dice "haz exactamente esto" y explica por qué.

## "¿Cómo escala esto a un equipo de 10+ personas?"

Es exactamente el caso de uso para el que está diseñado. Las prácticas concretas que ayudan:

- **PR Checklist obligatorio** (no opcional).
- **Pair programming** en las primeras features de cada nuevo dev.
- **Skills en `.cursorrules`** o equivalente para que el asistente de IA refuerce las reglas en autocompletes.
- **Retros trimestrales** sobre la arquitectura: ¿qué regla está estorbando? ¿qué no está cubierto?
- **Owner de la arquitectura**: alguien (puede rotar) responsable de mantener las skills al día y resolver dudas.

## ¿Otra pregunta?

Abre un issue con la etiqueta `question` y la respondemos. Si la pregunta es recurrente, la sumamos a este FAQ.
