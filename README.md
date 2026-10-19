# g6-streaming-entrega03-subgrupo03-codigo

## Chain of Responsibility — autenticação

Código do padrão comportamental **Chain of Responsibility** (GoF) aplicado ao login e à reautenticação (*step-up*) da plataforma de streaming. Autoria: Hugo Freitas Silva. Decisão e alternativas: [ADR-004](https://unbarqdsw2026-2-turma01.github.io/2026.2-T01-_G6_ProjetoStreamingVideo_Entrega_03/#/Base/Relatórios/1.1.3.SubEquipe_03/ADR/ADR-004-chain-of-responsibility-autenticacao).

## Como executar

Pré-requisitos: Node 20 ou superior e npm. O TypeScript roda pelo `tsx`, sem etapa de build.

```bash
git clone https://github.com/UnBArqDsw2026-2-Turma01/g6-streaming-entrega03-subgrupo03-codigo.git
cd g6-streaming-entrega03-subgrupo03-codigo
git checkout feat/autenticacao-chainOfResponsibilityBehavioralGoF
npm ci          # instala tsx, typescript e @types/node (só desenvolvimento)
npm run check   # verificação de tipos (tsc) e os testes (node:test)
npm run demo    # demonstração no terminal
```

O código não tem dependência de execução: criptografia (scrypt, HMAC, SHA-256) vem do módulo `node:crypto`.

## Participantes

| Participante GoF | Arquivo | O que faz |
| --- | --- | --- |
| Handler | `src/autenticacao/cadeia/authentication-handler.ts` | Interface `AuthenticationHandler` e a base `AbstractAuthenticationHandler`, que guarda o sucessor e repassa a requisição; no fim da cadeia, recusa (falha fechada) |
| ConcreteHandler | `src/autenticacao/cadeia/*-handler.ts` | Sete elos: limite de tentativas, atestação do cliente, senha, estado da conta, senha vazada, segundo fator, emissão de sessão; e o terminal do step-up |
| Client | `src/autenticacao/login-service.ts` | `LoginService` entrega a requisição ao primeiro elo e registra o resultado na auditoria |
| Request | `src/autenticacao/cadeia/authentication-context.ts` | `AuthenticationRequest` e o `AuthenticationContext` que percorre os elos |
| Montagem | `src/autenticacao/cadeia/authentication-chains.ts` | `buildLoginChain` e `buildStepUpChain`: duas cadeias com as mesmas classes |

As classes de `src/autenticacao/dominio/` são recortes do diagrama de autenticação da Entrega 02 (`Account`, `Credential`, `TwoFactorAuth`, `LeakedPasswordBloomFilter`, `ClientIntegrityAttestation`, `Session`, `StepUpAuthChallenge`, `AuditLog`).

## Limites declarados

- Repositórios, sessões e auditoria são em memória; a cadeia é síncrona.
- Hash de senha com scrypt (RFC 7914) nos parâmetros mínimos do OWASP, e não Argon2id: o Node não traz Argon2 no módulo `crypto` até a versão 22.
- A emissão do desafio de prova de trabalho e seu uso único não estão implementados; o elo só verifica a prova recebida.
- A demonstração reduz o custo do scrypt (N = 2^14) para rodar em poucos segundos; o padrão do código é N = 2^17.

## Testes

`npm test` roda 56 testes com o `node:test` (arquivos em `tests/`): cada elo isolado, as duas cadeias completas e os vetores de teste da RFC 6238 para o TOTP.

Relatório da subequipe: [1.1.3. SubEquipe_03](https://unbarqdsw2026-2-turma01.github.io/2026.2-T01-_G6_ProjetoStreamingVideo_Entrega_03/#/Base/Relatórios/1.1.3.SubEquipe_03/README).
