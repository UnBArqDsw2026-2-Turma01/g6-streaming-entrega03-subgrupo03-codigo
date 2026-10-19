import type { AuthenticationContext, AuthenticationOutcome } from "./authentication-context.ts";

/** Participante **Handler** do GoF: define a interface de tratamento e o encadeamento. */
export interface AuthenticationHandler {
    readonly name: string;
    /** Sucessor na cadeia; `null` no último elo. */
    readonly next: AuthenticationHandler | null;
    /** Devolve o sucessor, para a montagem encadeada `a.setNext(b).setNext(c)`. */
    setNext(next: AuthenticationHandler): AuthenticationHandler;
    handle(context: AuthenticationContext): AuthenticationOutcome;
}

/**
 * Implementação padrão do Handler, como no slide 61 da aula: a base guarda o
 * ponteiro para o próximo elo e `handle()` repassa a requisição. Cada
 * ConcreteHandler faz a sua verificação e chama `super.handle()` para seguir.
 *
 * Diferença deliberada em relação ao GoF: lá, uma requisição que chega ao fim da
 * cadeia sem tratamento simplesmente não é tratada. Em autenticação isso não pode
 * significar "aprovado"; por isso o fim da cadeia **recusa** (falha fechada).
 */
export abstract class AbstractAuthenticationHandler implements AuthenticationHandler {
    abstract readonly name: string;
    #next: AuthenticationHandler | null = null;

    get next(): AuthenticationHandler | null {
        return this.#next;
    }

    setNext(next: AuthenticationHandler): AuthenticationHandler {
        this.#next = next;
        return next;
    }

    handle(context: AuthenticationContext): AuthenticationOutcome {
        context.markPassed(this.name);
        if (this.#next) return this.#next.handle(context);
        return context.reject(
            this.name,
            "UNHANDLED",
            "nenhum elo concluiu a autenticação; a cadeia termina recusando (falha fechada)",
        );
    }
}
