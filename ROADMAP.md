# Roadmap

Este repositorio se publica en fases para mantener la calidad alta y permitir feedback temprano.

## ✅ Fase 1 — Fundación (release actual)

**Objetivo:** Tener un repo presentable con la arquitectura RN documentada, los ADRs más controversiales escritos, y un README que se sostenga solo.

- [x] README principal con tour rápido y reglas no negociables
- [x] Skills de React Native (Expo)
- [x] ADR 001 — MobX over Zustand
- [x] ADR 005 — ViewModel canonical pattern
- [x] FAQ inicial con 5 objeciones frecuentes
- [x] `getting-started.md` para aplicar a un proyecto existente
- [x] `when-not-to-use.md` (anti-evangelismo)
- [x] Licencia MIT, CONTRIBUTING, CHANGELOG

## 🚧 Fase 2 — Cobertura React web + monorepo

**Objetivo:** Cubrir las otras dos plataformas que ya están documentadas internamente.

- [ ] Skills de React web con styled-components
- [ ] Skills de monorepo / npm package (Turborepo + tsup + Changesets)
- [ ] Skills de demo-app dentro de monorepo
- [ ] ADR 002 — Inversify over Context
- [ ] ADR 003 — Class entities with index signature
- [ ] ADR 004 — One UseCase per action
- [ ] Diagramas SVG (capas, flujo VM, DI wiring)
- [ ] Más ejemplos en `examples/`

## 🔭 Fase 3 — Python (en exploración)

**Objetivo:** Llevar las mismas ideas de Clean Architecture al backend Python sin forzar el patrón MVVM (que no aplica sin View).

Hipótesis de trabajo:

- Stack: **FastAPI + Pydantic v2 + SQLAlchemy** (o Litestar como alternativa).
- DI: **`Depends` nativo de FastAPI** o `dependency-injector` para casos más complejos.
- Patrón: **Hexagonal / Ports-and-Adapters**, no MVVM.
- Mapeo conceptual:
  - `domain/entities` → dataclasses o Pydantic models
  - `domain/repositories` → `Protocol` o `ABC`
  - `domain/useCases` → idéntico, con `run(input) -> output`
  - `data/services` → adapters HTTP / SQL
  - ViewModel → **no aplica**; el "controller" es la ruta FastAPI

Feedback bienvenido: abre un issue con la etiqueta `python-exploration`.

## 🔭 Fase 4 — Tooling

**Objetivo:** Reducir la fricción de aplicar la arquitectura.

- [ ] CLI: `npx cas-cli new-feature Clients` que genera el scaffold completo siguiendo `feature-scaffold-rn.md`
- [ ] Templates ejecutables (degit-clonable) para RN, React web y monorepo
- [ ] VS Code extension con snippets de los patrones canónicos (idea, no commitida)
- [ ] ESLint plugin que valide las reglas de dependencia entre capas (idea, no commitida)

## Cómo influir en el roadmap

Las prioridades de Fase 3 y 4 dependen de feedback real. Si una pieza te interesa especialmente, abre un issue con la etiqueta `roadmap-vote` y un caso de uso concreto. No hago cosas porque "quedan bonitas en GitHub": las hago si alguien las va a usar.
