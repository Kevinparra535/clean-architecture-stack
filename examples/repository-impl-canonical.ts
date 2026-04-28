// examples/repository-impl-canonical.ts
//
// Plantilla canónica de Repository (interface en domain + Impl en data).
//
// Reglas no negociables:
// - La interfaz vive en src/domain/repositories/.
// - La implementación vive en src/data/repositories/.
// - El Impl mapea modelos de transporte (DTOs) a entidades del dominio.
// - El Impl nunca devuelve modelos crudos (snapshots, JSON pelado, etc.).
// - El Impl usa un Service que aísla los detalles del manager (Axios, Firebase, etc.).

// ── 1. La interfaz vive en domain/ ───────────────────────────────────────────
// src/domain/repositories/ClientRepository.ts

import { Client } from '@/domain/entities/Client';

export interface ClientRepository {
  getAll(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(client: Client): Promise<Client>;
  update(client: Client): Promise<Client>;
  delete(id: string): Promise<void>;
}

// ── 2. El Model (DTO) vive en data/ ──────────────────────────────────────────
// src/data/models/clientModel.ts

export type ClientModelConstructorParams = {
  id: string;
  full_name: string; // ⚠️ snake_case del backend, no lo renombramos aquí
  email: string;
  created_at: string; // viene como string ISO, lo parseamos
};

export class ClientModel {
  id: string;
  full_name: string;
  email: string;
  created_at: string;

  constructor(params: ClientModelConstructorParams) {
    this.id = params.id;
    this.full_name = params.full_name;
    this.email = params.email;
    this.created_at = params.created_at;
  }

  static fromJson(json: any): ClientModel {
    return new ClientModel({
      id: String(json.id),
      full_name: String(json.full_name ?? ''),
      email: String(json.email ?? ''),
      created_at: String(json.created_at ?? new Date().toISOString()),
    });
  }

  toJson(): Record<string, unknown> {
    return {
      id: this.id,
      full_name: this.full_name,
      email: this.email,
      created_at: this.created_at,
    };
  }
}

// Module augmentation + prototype para mapear a la entidad de dominio.
declare module './clientModel' {
  interface ClientModel {
    toDomain(): Client;
  }
}

ClientModel.prototype.toDomain = function toDomain(): Client {
  return new Client({
    id: this.id,
    name: this.full_name, // ⚠️ aquí sí renombramos al cruzar a dominio
    email: this.email,
    createdAt: new Date(this.created_at),
  });
};

// ── 3. El RepositoryImpl vive en data/ ───────────────────────────────────────
// src/data/repositories/ClientRepositoryImpl.ts

import { inject, injectable } from 'inversify';
import { TYPES } from '@/config/types';

@injectable()
export class ClientRepositoryImpl implements ClientRepository {
  constructor(
    @inject(TYPES.ClientService)
    private readonly service: ClientService,
  ) {}

  async getAll(): Promise<Client[]> {
    const models = await this.service.fetchAll();
    return models.map((m) => m.toDomain());
  }

  async getById(id: string): Promise<Client | null> {
    const model = await this.service.fetchById(id);
    return model ? model.toDomain() : null;
  }

  async create(client: Client): Promise<Client> {
    const model = await this.service.create({
      full_name: client.name,
      email: client.email,
    });
    return model.toDomain();
  }

  async update(client: Client): Promise<Client> {
    const model = await this.service.update(client.id, {
      full_name: client.name,
      email: client.email,
    });
    return model.toDomain();
  }

  async delete(id: string): Promise<void> {
    await this.service.delete(id);
  }
}

// (Tipo ficticio del Service para que el ejemplo compile)
type ClientService = {
  fetchAll(): Promise<ClientModel[]>;
  fetchById(id: string): Promise<ClientModel | null>;
  create(payload: Record<string, unknown>): Promise<ClientModel>;
  update(id: string, payload: Record<string, unknown>): Promise<ClientModel>;
  delete(id: string): Promise<void>;
};
