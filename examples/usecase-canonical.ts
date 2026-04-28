// examples/usecase-canonical.ts
//
// Plantilla canónica de UseCase.
// Una acción de negocio = un UseCase = una carpeta = un index.ts.
//
// Reglas no negociables:
// - Implementa UseCase<Input, Output>.
// - Método público obligatoriamente llamado run(data) o run() para Input = void.
// - Solo depende de contratos del dominio (interfaces de repositorios).
// - Nunca importa nada de data/* directamente.

// ── 1. Base interface (src/domain/useCases/UseCase.ts) ───────────────────────

export interface UseCase<Input, Output> {
  run(data: Input): Promise<Output>;
}

// ── 2. Ejemplo: GetAllClientUseCase (src/domain/useCases/GetAllClientUseCase/index.ts)

import { inject, injectable } from 'inversify';
import { TYPES } from '@/config/types';
import { Client } from '@/domain/entities/Client';
import { ClientRepository } from '@/domain/repositories/ClientRepository';

@injectable()
export class GetAllClientUseCase implements UseCase<void, Client[]> {
  constructor(
    @inject(TYPES.ClientRepository)
    private readonly repository: ClientRepository,
  ) {}

  async run(): Promise<Client[]> {
    return this.repository.getAll();
  }
}

// ── 3. Ejemplo: CreateClientUseCase (src/domain/useCases/CreateClientUseCase/index.ts)

@injectable()
export class CreateClientUseCase implements UseCase<Client, Client> {
  constructor(
    @inject(TYPES.ClientRepository)
    private readonly repository: ClientRepository,
  ) {}

  async run(client: Client): Promise<Client> {
    // Aquí iría validación / lógica de negocio si la hubiera.
    // Si solo es passthrough, también está bien — el valor del UseCase es el
    // contrato (descubrible, testeable, único punto de cambio si la regla aparece).
    return this.repository.create(client);
  }
}

// ── 4. Ejemplo con lógica de negocio real ────────────────────────────────────
//
// Cuando un UseCase deja de ser un wrapper trivial y empieza a tener reglas,
// es exactamente cuando esta arquitectura paga lo que cuesta.

@injectable()
export class TransferFundsUseCase
  implements UseCase<{ fromId: string; toId: string; amount: number }, void>
{
  constructor(
    @inject(TYPES.AccountRepository)
    private readonly accountRepo: AccountRepository,
    @inject(TYPES.TransactionRepository)
    private readonly txRepo: TransactionRepository,
  ) {}

  async run({
    fromId,
    toId,
    amount,
  }: {
    fromId: string;
    toId: string;
    amount: number;
  }): Promise<void> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const from = await this.accountRepo.getById(fromId);
    if (from.balance < amount) {
      throw new Error('Insufficient funds');
    }

    await this.accountRepo.updateBalance(fromId, from.balance - amount);
    const to = await this.accountRepo.getById(toId);
    await this.accountRepo.updateBalance(toId, to.balance + amount);
    await this.txRepo.record({ fromId, toId, amount, at: new Date() });
  }
}

// Notas:
// - Este UseCase no es un wrapper trivial: tiene validación, secuencia, errores.
// - Es testeable en aislamiento total (mockeas dos repos, listo).
// - Si mañana hay que loggear cada transferencia, agregas un repo más sin tocar la VM.
//
// Estos casos justifican la regla "1 acción = 1 UseCase". En CRUDs puros,
// la regla puede sentirse excesiva; ver ADR 004 para la discusión completa.

// (Tipos importados ficticios para que el ejemplo tenga sentido)
type AccountRepository = {
  getById(id: string): Promise<{ balance: number }>;
  updateBalance(id: string, balance: number): Promise<void>;
};
type TransactionRepository = {
  record(tx: {
    fromId: string;
    toId: string;
    amount: number;
    at: Date;
  }): Promise<void>;
};
