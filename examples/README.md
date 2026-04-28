# Examples — Snippets canónicos

Esta carpeta contiene **plantillas de referencia** de cada pieza de la arquitectura. No son un proyecto ejecutable: son archivos `.ts` que muestran cómo luce cada elemento canónico.

## Cómo usar estos archivos

1. **Lectura.** Léelos en orden si estás aprendiendo la arquitectura.
2. **Copia y reemplaza.** Cuando crees una feature nueva, copia el snippet y reemplaza `Client` por tu entidad, `Clients` por tu feature, etc.
3. **Como contexto para LLMs.** Pega el contenido como contexto cuando le pidas a un asistente de IA que genere código.

## Archivos

| Archivo                                                        | Qué muestra                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`entity-canonical.ts`](./entity-canonical.ts)                 | Entidad de dominio: clase + `[key: string]: any` + métodos        |
| [`usecase-canonical.ts`](./usecase-canonical.ts)               | UseCase: interface base + ejemplo trivial + ejemplo con lógica    |
| [`repository-impl-canonical.ts`](./repository-impl-canonical.ts) | Repo interface (domain) + Model (data) + RepoImpl (data)          |
| [`viewmodel-canonical.ts`](./viewmodel-canonical.ts)           | ViewModel completa con el patrón `ICalls` + `updateLoadingState`  |
| [`di-bindings-canonical.ts`](./di-bindings-canonical.ts)       | `types.ts` + `di.ts` con bindings de servicios, repos, UCs, VMs   |

## Orden recomendado de lectura

Si nunca has visto la arquitectura, este es el orden que más sentido tiene:

1. `entity-canonical.ts` — qué es una entidad de dominio
2. `repository-impl-canonical.ts` — cómo se conecta el dominio con los datos
3. `usecase-canonical.ts` — cómo se modelan las acciones de negocio
4. `viewmodel-canonical.ts` — cómo orquesta todo lo anterior la UI
5. `di-bindings-canonical.ts` — cómo se "cablea" todo junto

## Estos archivos NO compilan

Son referencias didácticas. Importan tipos ficticios, hacen referencia a paths que solo existen en proyectos reales, y mezclan varios archivos en uno por claridad. Para verlos en un proyecto real funcionando, ver el roadmap de templates ejecutables (Fase 4).
