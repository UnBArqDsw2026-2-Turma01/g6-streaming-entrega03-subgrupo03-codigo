import { IObserver, StreamEvent } from '../interfaces.js';

/**
 * ConcreteObserver para testes de carga e concorrência (Iniciativa Extra da SubEquipe 03)
 */
export class SimulatedFollowerObserver implements IObserver {
  public readonly id: string;
  public readonly name: string;
  public readonly targetSystem = 'Twitch Viewer Socket';
  private readonly latencyMs: number;
  private readonly failureRate: number;

  constructor(id: string, name: string, latencyMs = 5, failureRate = 0.001) {
    this.id = id;
    this.name = name;
    this.latencyMs = latencyMs;
    this.failureRate = failureRate;
  }

  async update(event: StreamEvent): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }

    if (Math.random() < this.failureRate) {
      throw new Error(`Socket timeout / Connection dropped para ${this.name} (${this.id})`);
    }
  }
}
