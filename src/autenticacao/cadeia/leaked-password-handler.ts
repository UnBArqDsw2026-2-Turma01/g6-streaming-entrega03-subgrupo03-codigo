import type { LeakedPasswordBloomFilter } from "../dominio/leaked-password-bloom-filter.ts";
import type { AuthenticationContext, AuthenticationOutcome } from "./authentication-context.ts";
import { AbstractAuthenticationHandler } from "./authentication-handler.ts";

/**
 * ConcreteHandler — senha presente em lista de vazamentos (DE02 da Entrega 02).
 * Não recusa: a senha já foi provada, então o elo só marca a troca obrigatória e
 * deixa a requisição seguir. Exigir a troca no login é decisão de projeto; o
 * NIST SP 800-63B pede a comparação com listas ao cadastrar ou trocar a senha.
 */
export class LeakedPasswordHandler extends AbstractAuthenticationHandler {
    readonly name = "LeakedPasswordHandler";
    readonly #filter: LeakedPasswordBloomFilter;

    constructor(filter: LeakedPasswordBloomFilter) {
        super();
        this.#filter = filter;
    }

    override handle(context: AuthenticationContext): AuthenticationOutcome {
        if (this.#filter.mightContain(context.request.password)) {
            context.flags.add("PASSWORD_CHANGE_REQUIRED");
        }
        return super.handle(context);
    }
}
