import { createHmac, timingSafeEqual } from "node:crypto";

export interface TotpOptions {
    readonly stepSeconds?: number;
    readonly digits?: number;
}

const DEFAULT_STEP_SECONDS = 30;
const DEFAULT_DIGITS = 6;

function timeStep(at: Date, stepSeconds: number): number {
    return Math.floor(at.getTime() / 1000 / stepSeconds);
}

/** HOTP (RFC 4226, seção 5.3): HMAC-SHA-1 do contador seguido de truncamento dinâmico. */
function hotp(secret: Buffer, counter: number, digits: number): string {
    const message = Buffer.alloc(8);
    message.writeBigUInt64BE(BigInt(counter));
    const digest = createHmac("sha1", secret).update(message).digest();
    const offset = digest[digest.length - 1]! & 0x0f;
    const binary =
        ((digest[offset]! & 0x7f) << 24) |
        (digest[offset + 1]! << 16) |
        (digest[offset + 2]! << 8) |
        digest[offset + 3]!;
    return String(binary % 10 ** digits).padStart(digits, "0");
}

/** TOTP (RFC 6238): HOTP em que o contador é o número de passos de tempo desde a época Unix. */
export function generateTotp(secret: Buffer, at: Date, options: TotpOptions = {}): string {
    const stepSeconds = options.stepSeconds ?? DEFAULT_STEP_SECONDS;
    return hotp(secret, timeStep(at, stepSeconds), options.digits ?? DEFAULT_DIGITS);
}

/**
 * `TwoFactorAuth` do diagrama da Entrega 02, restrito ao tipo `TOTP_RFC_6238`.
 * Aceita um passo de tempo antes e depois (atraso de relógio, RFC 6238 §5.2) e
 * recusa um código cujo passo já foi usado, como exige a mesma seção.
 */
export class TwoFactorAuth {
    readonly type = "TOTP_RFC_6238";
    readonly secret: Buffer;
    readonly isEnabled: boolean;
    #lastAcceptedStep = -1;

    constructor(secret: Buffer, isEnabled = true) {
        this.secret = secret;
        this.isEnabled = isEnabled;
    }

    verifyToken(code: string, at: Date, window = 1): boolean {
        const current = timeStep(at, DEFAULT_STEP_SECONDS);
        const received = Buffer.from(code);
        for (let step = current - window; step <= current + window; step++) {
            const expected = Buffer.from(hotp(this.secret, step, DEFAULT_DIGITS));
            if (expected.length === received.length && timingSafeEqual(expected, received)) {
                if (step <= this.#lastAcceptedStep) return false;
                this.#lastAcceptedStep = step;
                return true;
            }
        }
        return false;
    }
}
