# 00 — Filosofía y principios

Antes de las reglas concretas, conviene entender el "por qué". Esta arquitectura tiene tres principios rectores. Todo lo demás (MobX, Inversify, las skills, los PR checklists) son consecuencia de estos tres.

## Principio 1 — La consistencia vale más que la elegancia

Es mejor que **toda** una codebase esté escrita en un estilo "7/10" que tener un 30% en estilo "10/10" y un 70% en estilo "5/10". La razón es simple: el costo cognitivo de leer código no escala con la calidad promedio, escala con la **varianza**. Si cada feature está escrita por un desarrollador distinto con su criterio personal, el siguiente desarrollador necesita decodificar N estilos. Si todos siguen la misma plantilla canónica, decodifica uno y listo.

Esto explica por qué este repo es **opinado**: no porque las alternativas sean malas, sino porque elegir _una_ alternativa y comprometerse con ella es lo que da el rendimiento.

## Principio 2 — La arquitectura debe estar escrita, no en la cabeza del lead

Un equipo que depende de "preguntarle al senior" para saber dónde va un archivo o cómo se llama una clase, está acumulando deuda de comunicación. Esa deuda explota cuando el senior se va, cuando el equipo crece, o cuando hay que escalar a varios proyectos en paralelo.

Las **skills** de este repo son la materialización de este principio: las reglas están escritas con suficiente precisión como para que un desarrollador junior, un senior nuevo, o un asistente de IA puedan aplicarlas sin necesidad de un humano que les explique. Si una regla no se puede escribir, probablemente no es una regla — es una preferencia.

## Principio 3 — Las dependencias apuntan hacia el dominio

Esta es la única regla _técnica_ que esta arquitectura comparte literalmente con la "Clean Architecture" de Uncle Bob: el dominio (entidades + reglas de negocio) no debe depender de nada. Lo demás (UI, datos, frameworks) depende del dominio, no al revés.

¿Por qué importa? Porque el dominio es lo único que **no debería cambiar** cuando cambias de framework, de backend, o de UI. Si tu lógica de "calcular el descuento de un pedido" vive dentro de un componente React, no la puedes reusar en un script Node, en una Lambda, ni en un test. Si vive en una clase pura del dominio, sí.

Este principio se traduce en la **direccionalidad de imports**:

```
ui/  ────►  ui/viewModels  ────►  domain/useCases  ────►  domain/repositories
                                                                  ▲
                                                                  │
                                                          data/repositories (impl)
                                                                  │
                                                                  ▼
                                                        data/services ─► HTTP/Firebase
```

Las flechas apuntan a la izquierda (hacia el dominio). Nadie del dominio importa nada de la derecha.

---

## Lo que NO somos

Conviene también decir lo que esta arquitectura **no es**, para alinear expectativas:

- **No somos "purist Uncle Bob"**. Hacemos concesiones pragmáticas (entidades con `[key: string]: any`, ViewModels que viven cerca de la UI). El objetivo es código mantenible, no cumplir un manifiesto.
- **No somos "el mejor stack para todo"**. Para un sitio de marketing o un script único, este patrón es overkill. Ver [`04-when-not-to-use.md`](./04-when-not-to-use.md).
- **No somos "framework-agnostic" en sentido estricto**. Las skills de RN asumen Expo + MobX + Inversify. Las de React web asumen styled-components. Cambiar una pieza implica reescribir partes.
- **No somos "stateless"**. Esta arquitectura asume que vas a tener estado de UI no trivial y que vale la pena modelarlo en clases (ViewModels). Si tu app es mayormente derivada del servidor (server components, RSC), evalúa si necesitas todo esto.

---

## Lecturas que influyeron

- _Clean Architecture_, Robert C. Martin — para la direccionalidad de dependencias.
- _Domain-Driven Design_, Eric Evans — para la idea de un dominio rico y aislado.
- _MVVM_ original, John Gossman (2005) — para separar View de ViewModel.
- Comunidad MobX y discusiones sobre `makeAutoObservable` — para el patrón canónico de VM.
- Trabajos sobre Hexagonal / Ports-and-Adapters de Alistair Cockburn — base conceptual del data layer.

Esta arquitectura no inventa nada radicalmente nuevo. Lo que aporta es **una combinación específica, opinada y consistente** de ideas conocidas, validada en proyectos reales.
