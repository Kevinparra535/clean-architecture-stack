// examples/entity-canonical.ts
//
// Plantilla canónica de Entidad de dominio.
//
// Reglas no negociables:
// - Clase, no interface. Permite tener métodos de dominio si los necesitas.
// - Tipo XxxConstructorParams para los parámetros del constructor.
// - Index signature [key: string]: any para campos no tipados explícitamente
//   (ver ADR 003 para la justificación de esta concesión).
// - Object.assign(this, params) al final del constructor.
// - Sin imports de framework / infraestructura.

export type ClientConstructorParams = {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
  [key: string]: any;
};

export class Client {
  [key: string]: any;

  id: string;
  name: string;
  email: string;
  createdAt: Date;

  constructor(params: ClientConstructorParams) {
    this.id = params.id;
    this.name = params.name;
    this.email = params.email;
    this.createdAt = params.createdAt ?? new Date();

    // Permite que campos extra del backend (que aún no tipamos) lleguen sin
    // perderse. Esto es la concesión de ADR 003.
    Object.assign(this, params);
  }

  // ── Métodos de dominio (opcionales) ──────────────────────────────────────

  // Si tienes lógica de negocio que pertenece naturalmente a la entidad,
  // colócala aquí. NO en la VM, NO en un useCase.

  isCorporateEmail(): boolean {
    const personalDomains = ['gmail.com', 'hotmail.com', 'yahoo.com'];
    const domain = this.email.split('@')[1];
    return !personalDomains.includes(domain);
  }

  displayName(): string {
    return this.name.trim() || this.email;
  }
}
