// examples/viewmodel-canonical.ts
//
// Plantilla canónica de ViewModel — patrón obligatorio (ver ADR 005).
// Reemplaza <Feature> y <Entity> por los nombres reales de tu feature.
//
// Reglas no negociables:
// - @injectable() + makeAutoObservable(this) en el constructor.
// - Tipo ICalls que enumera todas las operaciones async.
// - updateLoadingState es el único lugar donde se mutan loading/error.
// - handleError es el único lugar donde se manejan excepciones.
// - Toda mutación post-await va envuelta en runInAction.
// - reset() resetea estado de UI (no estado persistente del dominio).

import { inject, injectable } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';

import { TYPES } from '@/config/types';
import { Client } from '@/domain/entities/Client';
import { GetAllClientUseCase } from '@/domain/useCases/GetAllClientUseCase';
import { CreateClientUseCase } from '@/domain/useCases/CreateClientUseCase';
import { UpdateClientUseCase } from '@/domain/useCases/UpdateClientUseCase';
import { DeleteClientUseCase } from '@/domain/useCases/DeleteClientUseCase';
import Logger from '@/ui/utils/Logger';

type ICalls = 'items' | 'create' | 'update' | 'delete';

@injectable()
export class ClientsViewModel {
  // ── State ─────────────────────────────────────────────────────────────────

  isItemsLoading: boolean = false;
  isItemsError: string | null = null;
  isItemsResponse: Client[] | null = null;

  isSubmitting: boolean = false;
  isSubmitError: string | null = null;
  hasSubmitSuccess: boolean = false;

  private logger = new Logger('ClientsViewModel');

  constructor(
    @inject(TYPES.GetAllClientUseCase)
    private readonly getAllClientUseCase: GetAllClientUseCase,
    @inject(TYPES.CreateClientUseCase)
    private readonly createClientUseCase: CreateClientUseCase,
    @inject(TYPES.UpdateClientUseCase)
    private readonly updateClientUseCase: UpdateClientUseCase,
    @inject(TYPES.DeleteClientUseCase)
    private readonly deleteClientUseCase: DeleteClientUseCase,
  ) {
    makeAutoObservable(this);
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  get isLoaded(): boolean {
    return !this.isItemsLoading && this.isItemsResponse !== null;
  }

  get itemCount(): number {
    return this.isItemsResponse?.length ?? 0;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async loadAll(): Promise<void> {
    this.updateLoadingState(true, null, 'items');
    try {
      const response = await this.getAllClientUseCase.run();
      runInAction(() => {
        this.isItemsResponse = response;
      });
      this.updateLoadingState(false, null, 'items');
    } catch (error) {
      this.handleError(error, 'items');
    }
  }

  async create(client: Client): Promise<boolean> {
    this.updateLoadingState(true, null, 'create');
    try {
      await this.createClientUseCase.run(client);
      runInAction(() => {
        this.hasSubmitSuccess = true;
      });
      this.updateLoadingState(false, null, 'create');
      return true;
    } catch (error) {
      this.handleError(error, 'create');
      return false;
    }
  }

  async update(client: Client): Promise<boolean> {
    this.updateLoadingState(true, null, 'update');
    try {
      await this.updateClientUseCase.run(client);
      runInAction(() => {
        this.hasSubmitSuccess = true;
      });
      this.updateLoadingState(false, null, 'update');
      return true;
    } catch (error) {
      this.handleError(error, 'update');
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    this.updateLoadingState(true, null, 'delete');
    try {
      await this.deleteClientUseCase.run(id);
      this.updateLoadingState(false, null, 'delete');
      return true;
    } catch (error) {
      this.handleError(error, 'delete');
      return false;
    }
  }

  consumeSubmitResult(): void {
    runInAction(() => {
      this.hasSubmitSuccess = false;
      this.isSubmitError = null;
    });
  }

  reset(): void {
    runInAction(() => {
      this.isItemsResponse = null;
      this.isItemsLoading = false;
      this.isItemsError = null;
      this.isSubmitting = false;
      this.isSubmitError = null;
      this.hasSubmitSuccess = false;
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private updateLoadingState(
    isLoading: boolean,
    error: string | null,
    type: ICalls,
  ) {
    runInAction(() => {
      switch (type) {
        case 'items':
          this.isItemsLoading = isLoading;
          this.isItemsError = error;
          break;
        case 'create':
        case 'update':
        case 'delete':
          this.isSubmitting = isLoading;
          this.isSubmitError = error;
          break;
      }
    });
  }

  private handleError(error: unknown, type: ICalls) {
    const errorMessage = `Error in ${type}: ${
      error instanceof Error ? error.message : String(error)
    }`;
    this.logger.error(errorMessage);
    this.updateLoadingState(false, errorMessage, type);
  }
}
