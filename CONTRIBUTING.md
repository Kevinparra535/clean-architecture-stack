# Cómo contribuir

Este repositorio documenta una arquitectura que evoluciona con el uso real. Tu feedback y contribuciones son bienvenidos.

## Tipos de contribuciones útiles

1. **Correcciones de typos / claridad** en docs y skills.
2. **Casos de uso no cubiertos** por las skills actuales (abrir issue primero).
3. **Patrones mejores** para problemas ya documentados (PR con justificación).
4. **ADRs nuevos** cuando una decisión recurrente no esté escrita.
5. **Ejemplos adicionales** en `examples/` que ilustren casos no triviales.
6. **Traducciones** del README y docs principales.

## Antes de abrir un PR

- Si el cambio es **mayor a corregir typos**, abre primero un issue para discutir.
- Si propones cambiar una regla "no negociable" del README, escribe un ADR explicando el porqué.
- Mantén el tono opinado pero honesto: este repo evita el evangelismo.

## Estilo de las skills

Las skills siguen este formato:

```markdown
---
name: nombre-kebab-case
description: Una línea que explique cuándo se usa. Empieza con un verbo.
---

# Título de la skill

## Goal
Qué se logra al aplicar esta skill.

## Reglas / Convenciones
Bullets cortos, sin ambigüedad.

## Templates canónicos
Bloques de código completos y ejecutables (cuando aplica).

## Output expectations
Qué debe producir alguien (humano o LLM) que aplique esta skill.
```

## Estilo de los ADRs

Los ADRs son cortos (2-4 párrafos máximo). Estructura:

```markdown
# ADR XXX — Título corto

## Contexto
Cuál es el problema o la pregunta.

## Decisión
Qué elegimos hacer.

## Alternativas consideradas
Qué descartamos y por qué.

## Consecuencias
Qué ganamos y qué cedemos con esta elección.
```

## Código de conducta

Sé respetuoso. Critica las ideas, no a las personas. No se permiten ataques personales, ridiculización, ni descalificaciones por nivel de experiencia.

## Licencia

Al contribuir, aceptas que tu contribución se licencie bajo MIT.
