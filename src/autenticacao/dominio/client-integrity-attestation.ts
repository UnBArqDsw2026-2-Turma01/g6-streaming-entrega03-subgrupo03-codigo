import { createHash } from "node:crypto";

/**
 * `ClientIntegrityAttestation` do diagrama da Entrega 02 (decisão DE01), reduzido
 * ao que a cadeia verifica: uma prova de trabalho e o sinal de automação do
 * navegador. A emissão e o uso único do desafio ficam fora deste recorte.
 */
export interface ClientIntegrityAttestation {
    readonly challenge: string;
    readonly proofOfWorkNonce: string;
    readonly difficulty: number;
    readonly hasWebDriverFlag: boolean;
    readonly issuedAt: Date;
}

function digest(challenge: string, nonce: string): string {
    return createHash("sha256").update(`${challenge}:${nonce}`).digest("hex");
}

/** A prova vale quando o SHA-256 de `desafio:nonce` começa com `difficulty` zeros hexadecimais. */
export function verifyProofOfWork(challenge: string, nonce: string, difficulty: number): boolean {
    return digest(challenge, nonce).startsWith("0".repeat(difficulty));
}

/** Usado pelo cliente simulado da demonstração e pelos testes. */
export function solveProofOfWork(challenge: string, difficulty: number): string {
    for (let nonce = 0; ; nonce++) {
        if (verifyProofOfWork(challenge, String(nonce), difficulty)) return String(nonce);
    }
}
