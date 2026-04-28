# 04 — Cuándo NO usar esta arquitectura

Una de las razones por las que confías en una recomendación técnica es porque la persona que la hace también te dice cuándo **no** seguirla. Aquí va el filtro honesto.

## Casos donde esto es overkill

### Sitios mayormente estáticos / marketing

Si tu app es un landing, una documentación, un blog, o un sitio con poca interacción, todo este aparato (Inversify, MobX, capas) es ruido. Usa Next.js con server components, MDX, y olvídate de ViewModels.

### Prototipos y MVPs de validación

Cuando estás validando si una idea funciona en el mercado, tu prioridad es **velocidad de iteración**, no mantenibilidad. Escribe el código más simple posible, valida con usuarios, y _luego_ refactoriza. Aplicar Clean Architecture desde el día 1 a un MVP que vas a tirar en 3 meses es perder tiempo.

Excepción: si el MVP _va a sobrevivir_ y eso lo sabes desde el inicio, sí vale la pena. Pero ese caso es raro.

### Apps con un solo desarrollador y un solo cliente final

Si vas a ser tú el único que toca el código, y el código vive en un dispositivo controlado por ti (script personal, herramienta interna que solo usas tú), las reglas de "consistencia para el equipo" no aplican. Puedes saltarte capas con tranquilidad.

### Equipos júnior sin acompañamiento

Esta arquitectura **funciona** con desarrolladores junior, pero solo si hay alguien (un senior, un lead, o las skills bien aplicadas con LLMs) que enseñe el patrón. Tirar a un equipo junior solo con el README a aplicar Clean Architecture sin guía resulta en código peor que si hubieran usado un patrón más simple. Si no tienes acompañamiento disponible, considera empezar con algo más liviano y migrar después.

### CRUDs puros sin lógica de negocio

Si tu app es literalmente "muestra una lista, edita un registro, guarda en la API", y nunca va a hacer más que eso, los UseCases se sienten vacíos (`run()` que solo llama al repo). En esos casos, una capa más delgada (servicios + componentes) puede ser suficiente.

Cuándo la regla cambia: el momento en que el primer UseCase deja de ser un wrapper trivial (porque hay validación, derivación, llamadas a múltiples repos, lógica de cálculo), Clean Architecture empieza a pagar.

### Apps con server components dominantes

Como menciona el [FAQ](./03-faq.md), si la mayor parte de tu lógica vive en el servidor (Next.js App Router con Server Components y Server Actions), esta arquitectura cubre solo las "islas cliente" y deja un porcentaje grande de tu app fuera del patrón. La inconsistencia resultante puede ser peor que no aplicar la arquitectura del todo.

## Casos donde necesitas adaptarla

### Apps con realtime intensivo (chat, colaboración en vivo)

El patrón de "VM llama a UseCase, UseCase llama a Repo, Repo devuelve datos" funciona bien para request/response. Para streams (WebSockets, Firestore listeners), necesitas adaptar:

- Los repos exponen `Observable<T>` o callbacks en vez de `Promise<T>`.
- Las VMs gestionan suscripciones con `reaction` o `autorun`.
- El cleanup explícito en `dispose()` deja de ser opcional.

La estructura general se mantiene; los detalles cambian. Hay un caso documentado en [`examples/`](../examples/) (en Fase 2).

### Apps con estado offline crítico (sync, conflict resolution)

Si tu app necesita lógica de sincronización compleja (escrituras locales optimistas, resolución de conflictos, merge de cambios offline), tu data layer es **mucho más** que un simple wrapper de fetch. Vas a necesitar:

- Un store local (SQLite, WatermelonDB, MMKV).
- Un sync engine (custom o librería como Replicache).
- Repos que coordinan local + remoto.

El patrón sigue funcionando, pero la implementación de los repos crece a 5-10x.

### Apps embebidas / kioscos / pantallas siempre conectadas

Para casos donde la app no es realmente "una app" sino un componente de un sistema más grande (kiosco de auto-checkout, dashboard de monitoreo, pantalla de menú digital), las reglas de UX (navegación, estado de error) cambian tanto que las plantillas de ViewModels y Screens necesitan revisión profunda. La arquitectura sigue siendo válida, pero los snippets canónicos no aplican literalmente.

## Señales de que quizás te equivocaste eligiendo esto

Si a los 2-3 meses de aplicar la arquitectura ves alguna de estas señales, **conversa con tu equipo y considera revertir o adaptar**:

- **El equipo evita escribir features nuevas** porque "es mucho código boilerplate". Síntoma de que la app es demasiado simple para esto.
- **Hay 5 capas para hacer un fetch trivial** y nadie las defiende. La arquitectura debe pagar; si solo cuesta, está mal aplicada o mal elegida.
- **Los tests son frágiles** y se rompen por cambios estructurales (no de lógica). Significa que estás testeando el grafo de DI, no el comportamiento. Reescríbelos enfocados en comportamiento o quita la arquitectura.
- **Nadie revisa los PRs aplicando el checklist**. Significa que el equipo no compró la arquitectura. Sin compromiso colectivo, esto se degrada en 3 meses.

## En resumen

> Esta arquitectura es para **apps con dominio rico, equipos medianos, vida larga**.
> Para todo lo demás, considera algo más simple.

Y si dudas: empieza simple. Migrar de "código React idiomático" a "Clean Architecture" es factible. Migrar al revés es traumático. La fricción de empezar simple es menor que la de tirar arquitectura a la basura.
