# 01 — Getting started

Esta guía explica cómo aplicar la arquitectura en un proyecto **nuevo** o **existente**. No incluye scripts ni boilerplate ejecutable: la idea es que entiendas las decisiones y las traslades a tu setup. Para snippets concretos, ver [`examples/`](../examples/).

## En un proyecto nuevo (RN Expo)

### 1. Instala las dependencias base

```bash
npx create-expo-app my-app -t expo-template-blank-typescript
cd my-app
npm install mobx mobx-react-lite inversify reflect-metadata
npm install -D jest jest-expo @testing-library/react-native
```

### 2. Habilita decoradores en TypeScript

En `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "useDefineForClassFields": false,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. Importa `reflect-metadata` antes que cualquier otra cosa

En `index.ts` o `App.tsx`, **primera línea**:

```ts
import 'reflect-metadata';
```

Sin esto, Inversify no funciona.

### 4. Crea la estructura de carpetas

```
src/
├── ui/
│   ├── screens/
│   ├── components/
│   ├── styles/
│   └── utils/
├── domain/
│   ├── entities/
│   ├── repositories/
│   ├── services/
│   └── useCases/
│       └── UseCase.ts
├── data/
│   ├── models/
│   ├── repositories/
│   └── services/
├── config/
│   ├── di.ts
│   └── types.ts
└── __test__/
    └── setupTests.ts
```

### 5. Crea el contrato base de UseCase

```ts
// src/domain/useCases/UseCase.ts
export interface UseCase<Input, Output> {
  run(data: Input): Promise<Output>;
}
```

### 6. Configura Inversify

```ts
// src/config/types.ts
export const TYPES = {
  // se llena conforme agregas features
} as const;

// src/config/di.ts
import 'reflect-metadata';
import { Container } from 'inversify';

export const container = new Container();
// bind(...).to(...) conforme agregues clases
```

### 7. Aplica la skill de scaffold para tu primera feature

Abre [`skills/react-native/feature-scaffold-rn.md`](../skills/react-native/feature-scaffold-rn.md), pega el contenido en tu asistente de IA o úsalo como referencia humana, y genera tu primera feature vertical end-to-end.

## En un proyecto existente

Migrar un proyecto existente a esta arquitectura es un proceso de **refactor incremental**, no un big bang. Recomendación:

### Fase A — Establecer el esqueleto

1. Crea las carpetas `domain/`, `data/`, `config/` sin tocar lo existente.
2. Define `UseCase.ts` y un `container` de Inversify vacío.
3. Documenta en el README del proyecto las reglas que vas a aplicar de aquí en adelante.

### Fase B — Migrar feature por feature

Para cada feature nueva o cualquier feature que vayas a tocar:

1. Crea la entidad de dominio (si no existe).
2. Crea el contrato de repositorio.
3. Crea el `RepositoryImpl` envolviendo la lógica de fetch/Firebase que ya tenías.
4. Extrae los UseCases (uno por acción).
5. Crea la ViewModel siguiendo el patrón canónico.
6. Refactoriza la pantalla para que solo dependa de la VM.

### Fase C — Imponer la regla en el equipo

1. Adopta el [PR Checklist](../skills/react-native/pr-checklist-clean-architecture.md) en tu proceso de revisión.
2. Las features viejas que no se han migrado se permiten pero se marcan como deuda técnica.
3. Establece un objetivo (ej: "100% de features nuevas siguen la arquitectura, refactor de 1 feature legacy por sprint").

## En un equipo

Si vas a aplicar esto con otros desarrolladores:

1. **Sesión inicial (1-2 horas)** — recorre este README + el ADR 005 con el equipo. Resuelve dudas. No discutas la arquitectura en sí; eso vendrá después.
2. **Pair programming en la primera feature** — el lead (o quien adoptó esto primero) hace pair con otro dev en la primera feature scaffolded. Esto enseña 10x más que cualquier documento.
3. **Code review estricto en las primeras 5 features** — usa el PR checklist religiosamente. Después de 5 features cumplidas, el patrón se interioriza y se relaja la fricción.
4. **Retros sobre la arquitectura cada 4-6 sprints** — ¿hay reglas que no aportan? ¿hay casos no cubiertos? Documenta en ADRs.

## Aplicar las skills con LLMs

Si usas Claude (con Projects), Cursor, Copilot Workspace o similar:

1. Pega el contenido de la skill relevante (`feature-scaffold-rn.md`, etc.) en tu **system prompt**, **project rules** o **`.cursorrules`**.
2. Cuando pidas una feature nueva, el LLM seguirá las reglas sin que tengas que repetirlas.
3. Cuando hagas code review con LLM, pega el PR checklist correspondiente como contexto.

Esta es la razón por la que las skills están escritas con un nivel de precisión inusual para "documentación": están diseñadas para ser ejecutadas por una máquina, no solo leídas.

## Próximo paso

Ve a [`skills/react-native/`](../skills/react-native/) y abre `feature-scaffold-rn.md`. Ese es el documento que vas a usar más en el día a día.
