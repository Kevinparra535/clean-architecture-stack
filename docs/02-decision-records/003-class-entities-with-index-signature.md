# ADR 003 — Entidades del dominio como clases con `[key: string]: any`

## Contexto

Necesitamos definir cómo representar las entidades del dominio (`Client`, `Bank`, `Session`, etc.) en TypeScript. Las entidades son lo que la UI consume y lo que los UseCases manipulan. Tres enfoques compitieron:

1. **Interfaces / `type` puros.** Cero runtime, máxima inferencia.
2. **Clases con tipado estricto.** Sin escape, todos los campos declarados.
3. **Clases con tipado parcial + `[key: string]: any`.** Tipo lo importante, deja escape para campos no críticos.

## Decisión

**Elegimos la opción 3:** entidades como clases, con campos críticos tipados explícitamente, una `index signature` (`[key: string]: any`), y `Object.assign(this, params)` en el constructor.

```ts
export type ClientConstructorParams = {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
};

export class Client {
  [key: string]: any;
  id: string;
  name: string;
  email: string;

  constructor(params: ClientConstructorParams) {
    this.id = params.id;
    this.name = params.name;
    this.email = params.email;
    Object.assign(this, params);
  }
}
```

## Alternativas consideradas

### A. Interfaces / `type` puros

**A favor:**
- Cero runtime, cero costo en bundle.
- Inferencia máxima de TypeScript.
- Sin necesidad de `Object.assign` ni patrones de clase.

**En contra:**
- **No puedes tener métodos de dominio.** Si una entidad tiene una regla de negocio que pertenece a ella (por ejemplo, `client.isCorporateEmail()`), con interfaces tienes que implementarla como función externa. La cohesión se rompe.
- **No hay constructor.** No puedes garantizar que se inicialicen valores por defecto consistentes (`createdAt = new Date()`, etc.) sin un patrón de factory paralelo.
- **`instanceof` no funciona.** Lo cual a veces importa para distinguir tipos en runtime.

### B. Clases con tipado estricto (sin index signature)

**A favor:**
- Aprovecha TypeScript al 100%. Cualquier campo no declarado es un error.
- Refactors guiados por el compilador.

**En contra:**
- **Choca con backends que evolucionan rápido.** Si la API agrega un campo `verified_at` que aún no necesitamos pero lo expone, una entidad estrictamente tipada lo descarta silenciosamente o requiere un nuevo PR para agregarlo formalmente.
- **Modela rigidez que no existe.** El backend en la realidad **no es estricto**; pretender que sí es modelar mal el dominio.
- **Genera fricción de iteración** en proyectos donde producto + backend están en flujo de descubrimiento.

### C. Records puros (`Record<string, any>`)

**A favor:**
- Máxima flexibilidad.

**En contra:**
- Pierde absolutamente todo el valor de TypeScript. El compilador no protege de tipos en `id`, `name`, etc. Inviable.

## Por qué la opción 3 gana en este contexto

1. **Tipa lo que importa.** Los campos críticos (`id`, `name`, fechas) están tipados exactamente y el compilador protege su uso.
2. **Deja escape para lo que evoluciona.** Campos nuevos del backend llegan a la entidad sin perderse, y pueden consumirse desde la UI sin esperar un PR de tipado.
3. **Permite métodos de dominio.** `client.isCorporateEmail()` vive donde tiene sentido: en la entidad.
4. **Defaults consistentes.** El constructor garantiza valores razonables (`createdAt = new Date()`).
5. **`instanceof` funciona.** Útil para distinguir entidades en runtime cuando sea necesario.

## Consecuencias

### Ganamos
- Velocidad de iteración con backends inestables.
- Cohesión de dominio (datos + comportamiento juntos).
- Ergonomía: `new Client({...json})` y listo.
- Defaults garantizados sin factories paralelos.

### Cedemos
- **Tipado parcial.** Si el backend manda un campo `lats_login_at` (typo), la entidad lo acepta felizmente. El compilador no avisa. Esto es real y hay que reconocerlo.
- **Refactors menos seguros.** Renombrar `name` a `fullName` no detecta automáticamente accesos hechos a través de la index signature.
- **Estamos fuera del consenso "TypeScript estricto".** Algunos revisores de código van a marcar `[key: string]: any` como code smell. Hay que defender la decisión con este ADR.

## Cuándo reconsiderar

- **Si el backend es completamente estable, versionado y contractual** (por ejemplo, expuesto por un OpenAPI estricto que se regenera automáticamente como tipos), la index signature deja de aportar y agrega ruido. En ese caso, conviene **quitar `[key: string]: any`** y tipar exhaustivamente.
- **Si descubrimos bugs recurrentes causados por la flexibilidad** (campos mal escritos, accesos a propiedades que no existen), reevaluar.
- Si el equipo adopta **runtime validators** (Zod, Valibot) en la frontera de datos, parte de la justificación pierde fuerza, ya que la validación atrapa los errores en tiempo de ejecución. En ese caso, considerar el modelo: validador en la frontera + entidad estrictamente tipada en el dominio.

## Reglas de aplicación

1. **Los campos críticos siempre se tipan explícitamente** en la clase. La index signature NO es excusa para no tipar `id` o `name`.
2. **El constructor asigna explícitamente los campos críticos** antes del `Object.assign(this, params)`.
3. **Los métodos de dominio van en la entidad**, no en la VM ni en el UseCase.
4. **La index signature está en el `type ConstructorParams` y en la clase**, ambas. No solo una.
5. **Si vas a quitar `[key: string]: any` en una entidad específica** porque su backend es estable y tipado, hazlo solo en esa entidad y documenta el porqué con un comentario.

## Referencias

- Discusión de TypeScript sobre index signatures: https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures
- Patrón "anemic vs rich domain model" — esta decisión apunta a domain model rico, no anémico.
- Esta es la decisión más controversial del stack. Si la cuestionan, no entres en defensa: muestra este ADR.
