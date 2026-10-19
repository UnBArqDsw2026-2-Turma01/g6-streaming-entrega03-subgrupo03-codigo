export class SimulatedFollowerObserver {
    id;
    name;
    targetSystem = 'Subscriber Edge Client';
    latencyMs;
    failureRate;
    constructor(id, name, latencyMs = 5, failureRate = 0.001) {
        this.id = id;
        this.name = name;
        this.latencyMs = latencyMs;
        this.failureRate = failureRate;
    }
    async update(event) {
        if (this.latencyMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
        }
        if (Math.random() < this.failureRate) {
            throw new Error(`Socket timeout / Connection dropped para ${this.name} (${this.id})`);
        }
    }
}
