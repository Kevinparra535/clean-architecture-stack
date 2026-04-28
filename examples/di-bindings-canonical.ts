// examples/di-bindings-canonical.ts
//
// Plantilla canónica de bindings de Inversify.
// Muestra src/config/types.ts y src/config/di.ts en un solo archivo de ejemplo.
//
// Reglas no negociables:
// - Todas las TYPES son símbolos (Symbol.for) o strings consistentes.
// - Servicios y RepositoryImpl: singleton.
// - UseCases: transient.
// - ViewModels: transient (a menos que sea VM global, raro).
// - reflect-metadata se importa una sola vez al inicio del bootstrap.

// ── 1. src/config/types.ts ───────────────────────────────────────────────────

export const TYPES = {
  // ── Services (capa data) ──
  ClientService: Symbol.for('ClientService'),

  // ── Repositories (capa domain → impl en data) ──
  ClientRepository: Symbol.for('ClientRepository'),

  // ── UseCases (capa domain) ──
  GetAllClientUseCase: Symbol.for('GetAllClientUseCase'),
  GetClientUseCase: Symbol.for('GetClientUseCase'),
  CreateClientUseCase: Symbol.for('CreateClientUseCase'),
  UpdateClientUseCase: Symbol.for('UpdateClientUseCase'),
  DeleteClientUseCase: Symbol.for('DeleteClientUseCase'),

  // ── ViewModels (capa ui) ──
  ClientsViewModel: Symbol.for('ClientsViewModel'),
} as const;

// ── 2. src/config/di.ts ──────────────────────────────────────────────────────

import 'reflect-metadata'; // ⚠️ obligatorio antes de cualquier @injectable
import { Container } from 'inversify';

// Imports de implementaciones
import { ClientServiceImpl } from '@/data/services/ClientService';
import { ClientRepositoryImpl } from '@/data/repositories/ClientRepositoryImpl';

import { GetAllClientUseCase } from '@/domain/useCases/GetAllClientUseCase';
import { GetClientUseCase } from '@/domain/useCases/GetClientUseCase';
import { CreateClientUseCase } from '@/domain/useCases/CreateClientUseCase';
import { UpdateClientUseCase } from '@/domain/useCases/UpdateClientUseCase';
import { DeleteClientUseCase } from '@/domain/useCases/DeleteClientUseCase';

import { ClientsViewModel } from '@/ui/screens/Clients/ClientsViewModel';

// Imports de tipos (interfaces)
import type { ClientRepository } from '@/domain/repositories/ClientRepository';
import type { ClientService } from '@/domain/services/ClientService';

export const container = new Container();

// ── Services: singleton ──
container
  .bind<ClientService>(TYPES.ClientService)
  .to(ClientServiceImpl)
  .inSingletonScope();

// ── Repositories: singleton ──
container
  .bind<ClientRepository>(TYPES.ClientRepository)
  .to(ClientRepositoryImpl)
  .inSingletonScope();

// ── UseCases: transient ──
container
  .bind<GetAllClientUseCase>(TYPES.GetAllClientUseCase)
  .to(GetAllClientUseCase);
container.bind<GetClientUseCase>(TYPES.GetClientUseCase).to(GetClientUseCase);
container
  .bind<CreateClientUseCase>(TYPES.CreateClientUseCase)
  .to(CreateClientUseCase);
container
  .bind<UpdateClientUseCase>(TYPES.UpdateClientUseCase)
  .to(UpdateClientUseCase);
container
  .bind<DeleteClientUseCase>(TYPES.DeleteClientUseCase)
  .to(DeleteClientUseCase);

// ── ViewModels: transient ──
container.bind<ClientsViewModel>(TYPES.ClientsViewModel).to(ClientsViewModel);

// ── 3. Uso desde una pantalla ────────────────────────────────────────────────
//
// ```tsx
// import { container } from '@/config/di';
// import { TYPES } from '@/config/types';
// import { ClientsViewModel } from './ClientsViewModel';
//
// const ClientsScreen = observer(() => {
//   const vm = useMemo(
//     () => container.get<ClientsViewModel>(TYPES.ClientsViewModel),
//     [],
//   );
//   useEffect(() => { vm.loadAll(); }, [vm]);
//   // ...
// });
// ```
//
// ── 4. Uso en tests (NO se usa el container) ─────────────────────────────────
//
// ```ts
// const getAll = { run: jest.fn().mockResolvedValue([sampleClient]) };
// const vm = new ClientsViewModel(getAll, ...otrosMocks);
// await vm.loadAll();
// expect(vm.isItemsResponse).toEqual([sampleClient]);
// ```
//
// Los tests NO usan container.get — instancian la VM directamente con mocks.
// Esa es la diferencia entre "DI para producción" y "DI para tests".
