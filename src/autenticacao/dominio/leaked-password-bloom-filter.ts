import { createHash } from "node:crypto";

/**
 * `LeakedPasswordBloomFilter` do diagrama da Entrega 02 (decisão DE02): lista de
 * senhas vazadas em memória, sem guardar as senhas. Um filtro de Bloom pode dar
 * falso positivo, nunca falso negativo (BLOOM, 1970). Os k índices saem de dois
 * hashes, pela técnica de Kirsch e Mitzenmacher (2008).
 */
export class LeakedPasswordBloomFilter {
    readonly filterCapacity: number;
    readonly falsePositiveRate: number;
    readonly sizeInBits: number;
    readonly hashCount: number;
    readonly #bits: Uint8Array;

    constructor(filterCapacity: number, falsePositiveRate = 0.01) {
        if (filterCapacity <= 0) throw new RangeError("capacidade deve ser positiva");
        if (falsePositiveRate <= 0 || falsePositiveRate >= 1) {
            throw new RangeError("taxa de falso positivo deve estar entre 0 e 1");
        }
        this.filterCapacity = filterCapacity;
        this.falsePositiveRate = falsePositiveRate;
        // m = -n·ln(p) / (ln 2)² e k = (m/n)·ln 2
        this.sizeInBits = Math.ceil((-filterCapacity * Math.log(falsePositiveRate)) / Math.LN2 ** 2);
        this.hashCount = Math.max(1, Math.round((this.sizeInBits / filterCapacity) * Math.LN2));
        this.#bits = new Uint8Array(Math.ceil(this.sizeInBits / 8));
    }

    static fromList(passwords: readonly string[], falsePositiveRate = 0.01): LeakedPasswordBloomFilter {
        const filter = new LeakedPasswordBloomFilter(Math.max(1, passwords.length), falsePositiveRate);
        for (const password of passwords) filter.add(password);
        return filter;
    }

    add(password: string): void {
        for (const index of this.#indexes(password)) {
            this.#bits[index >> 3]! |= 1 << (index & 7);
        }
    }

    /** `true` quando a senha provavelmente está na lista; `false` é garantido. */
    mightContain(password: string): boolean {
        for (const index of this.#indexes(password)) {
            if ((this.#bits[index >> 3]! & (1 << (index & 7))) === 0) return false;
        }
        return true;
    }

    *#indexes(password: string): Generator<number> {
        const digest = createHash("sha256").update(password).digest();
        const h1 = digest.readUInt32BE(0);
        const h2 = digest.readUInt32BE(4);
        for (let i = 0; i < this.hashCount; i++) {
            yield (h1 + i * h2) % this.sizeInBits;
        }
    }
}
