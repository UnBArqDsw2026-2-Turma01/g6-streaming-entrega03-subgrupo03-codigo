# Twitch UGC Streaming - Padrões de Projeto GoF com Pipeline de Moderação

Projeto desenvolvido para a **Entrega 3 da disciplina Desenho de Software (UnB Gama)**, sob orientação da **Profa. Dra. Milene Serrano**, focado na modelagem e implementação dos Padrões de Projeto GoF (Gang of Four) aliados ao uso de Inteligência Artificial Generativa no contexto de streaming UGC (**Twitch, YouTube Live e Kick**).

---

## 👥 SubEquipe 03: Padrões Comportamentais + IA Generativa

- **Padrões Modelados:** 
  - **GoF Observer** (Slides 08 e 53): Ciclo de vida da live e pipeline reativo de **Moderação**:
    - **AutoMod**: Filtro automático de chat contra toxicidade e links maliciosos;
    - **Safety Vision AI**: Detecção de **Gore** e **Nudez (NSFW)** com aplicação de **Content Warning (Gate 18+)** ou suspensão;
    - **Copyright DMCA**: Detecção de áudio protegido por direitos autorais com **Audio Muting** automático;
    - **ModView**: Painel em tempo real para ações punitivas de moderadores humanos.
  - **GoF Strategy** (Slides 11-18): Variação dinâmica dos algoritmos de despacho de eventos aos espectadores.
- **Canais Reais de Demonstração:**
  - 🔴 **YouTube Live**: [Sorashina Sopia](https://www.youtube.com/@SorashinaSopia/videos) (`@SorashinaSopia` - VTuber / JRPG)
  - 🟣 **Twitch**: **Dima Wallhacks** (`dima_wallhacks` - Streamer Americano de CS2)
  - 🟢 **Kick.com**: **eskimozin** (`eskimozin` - Streamer Brasileiro de IRL & Chatting)
- **Iniciativa Extra:** Implementação Assíncrona e Tratamento de Concorrência com Benchmark Comparativo (Síncrono Clássico vs. Assíncrono Otimizado com 2.000 espectadores).
- **Iniciativa Transversal:** [ADR 003 - Adoção dos Padrões Observer e Strategy para Despacho Concorrente](../ADR/ADR-003-observer-concorrente-notificacoes-twitch.md)
- **Diagramas Oficiais GoF:** [1.1.3.1. Modelagem UML](../1.1.3.1.ModelagemObserver.md) e [1.1.3.2. Sequência e Estados](../1.1.3.2.SequenciaObserver.md)
- **Relatório Geral da SubEquipe:** [Documentação Consolidada](../README.md)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (v20+ recomendado)
- **npm** (v10+)

### Instalação
```bash
git clone https://github.com/UnBArqDsw2026-2-Turma01/g6-streaming-entrega03-subgrupo03-codigo.git
cd g6-streaming-entrega03-subgrupo03-codigo
npm install
```

### Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run demo` | Executa a demonstração automatizada de streaming e moderação reativa |
| `npm run interactive` | Abre o console REPL interativo de simulação de streaming e moderação |
| `npm run web` | Inicia o servidor Web com dashboard ModView em tempo real (http://localhost:3333) |
| `npm run benchmark` | Executa o teste de carga comparativo com 2.000 espectadores (Iniciativa Extra) |
| `npm test` | Executa as suítes do Observer (13 testes), da autenticação (56 testes) e do chat (5 testes) com o Node Test Runner |
| `npm run test:chat` | Testes do Observer da sala de chat |
| `npm run demo:autenticacao` | Demonstração do Chain of Responsibility no login e no step-up |
| `npm run check:autenticacao` | Verificação de tipos e testes do Chain of Responsibility |
| `npm run build` | Compila o projeto TypeScript para a pasta `dist/` |

---

## 📊 Resultados do Benchmark de Concorrência (Iniciativa Extra)

```
================================================================================
                       TABELA COMPARATIVA DE DESEMPENHO                       
================================================================================
┌─────────┬──────────────────────────────────┬──────────────┬──────────────────────┬──────────────────┬──────────────────────┬─────────────┬─────────────────┐
│ (index) │ Estratégia Adotada               │ Espectadores │ Bloqueio Thread (ms) │ Tempo Total (ms) │ Throughput (notif/s) │ Entregues   │ Falhas Isoladas │
├─────────┼──────────────────────────────────┼──────────────┼──────────────────────┼──────────────────┼──────────────────────┼─────────────┼─────────────────┤
│ 0       │ 'Strategy: Síncrono Tradicional' │ 2000         │ '10386.67'           │ '10387.26'       │ '192.5'              │ '1999/2000' │ 1               │
│ 1       │ 'Strategy: Assíncrono Otimizado' │ 2000         │ '6.10'               │ '81.92'          │ '24415.2'            │ '1995/2000' │ 5               │
└─────────┴──────────────────────────────────┴──────────────┴──────────────────────┴──────────────────┴──────────────────────┴─────────────┴─────────────────┘
📌 Conclusões:
 1. Speedup Total de Entrega: 126.8x mais rápido na estratégia assíncrona.
 2. Liberação da Thread Principal: 1.703x mais rápida (~6,10 ms).
 3. Resiliência: Falhas isoladas de socket tratadas sem travar a transmissão.
```

---

## 📂 Navegação na Documentação

- 📐 [**1.1.3.1. Modelagem UML (Classes, Componentes e Casos de Uso)**](../1.1.3.1.ModelagemObserver.md)
- 🔄 [**1.1.3.2. Sequência, Estados e Atividades de Moderação**](../1.1.3.2.SequenciaObserver.md)
- 📄 [**Relatório Geral Consolidado da SubEquipe 03**](../README.md)
- 🏛️ [**ADR 003: Architecture Decision Record**](../ADR/ADR-003-observer-concorrente-notificacoes-twitch.md)
- 💻 [Código do Subject / Context (StreamChannel.ts)](src/patterns/observer/StreamChannel.ts)
- 🔌 [Interfaces GoF Observer](src/patterns/observer/interfaces.ts) | [Interfaces GoF Strategy](src/patterns/strategy/interfaces.ts)
- 🧪 [13 Testes Unitários Automatizados](src/__tests__/observer.test.ts)

---

## 🔐 Chain of Responsibility — Autenticação (Hugo Freitas Silva)

Código do padrão comportamental **Chain of Responsibility** (GoF) aplicado ao login e à reautenticação (*step-up*) da plataforma de streaming. Autoria: Hugo Freitas Silva. Decisão e alternativas: [ADR-004](https://unbarqdsw2026-2-turma01.github.io/2026.2-T01-_G6_ProjetoStreamingVideo_Entrega_03/#/Base/Relatórios/1.1.3.SubEquipe_03/ADR/ADR-004-chain-of-responsibility-autenticacao).

### Como executar

Pré-requisitos: Node 20 ou superior e npm. O TypeScript roda pelo `tsx`, sem etapa de build; a verificação de tipos usa `tsconfig.autenticacao.json`, separado do `tsconfig.json` do Observer.

```bash
git clone https://github.com/UnBArqDsw2026-2-Turma01/g6-streaming-entrega03-subgrupo03-codigo.git
cd g6-streaming-entrega03-subgrupo03-codigo
npm ci                        # instala as dependências travadas no package-lock
npm run check:autenticacao    # verificação de tipos (tsc) e os 56 testes (node:test)
npm run demo:autenticacao     # demonstração no terminal
```

O código não tem dependência de execução: criptografia (scrypt, HMAC, SHA-256) vem do módulo `node:crypto`.

### Participantes

| Participante GoF | Arquivo | O que faz |
| --- | --- | --- |
| Handler | `src/autenticacao/cadeia/authentication-handler.ts` | Interface `AuthenticationHandler` e a base `AbstractAuthenticationHandler`, que guarda o sucessor e repassa a requisição; no fim da cadeia, recusa (falha fechada) |
| ConcreteHandler | `src/autenticacao/cadeia/*-handler.ts` | Sete elos: limite de tentativas, atestação do cliente, senha, estado da conta, senha vazada, segundo fator, emissão de sessão; e o terminal do step-up |
| Client | `src/autenticacao/login-service.ts` | `LoginService` entrega a requisição ao primeiro elo e registra o resultado na auditoria |
| Request | `src/autenticacao/cadeia/authentication-context.ts` | `AuthenticationRequest` e o `AuthenticationContext` que percorre os elos |
| Montagem | `src/autenticacao/cadeia/authentication-chains.ts` | `buildLoginChain` e `buildStepUpChain`: duas cadeias com as mesmas classes |

As classes de `src/autenticacao/dominio/` são recortes do diagrama de autenticação da Entrega 02 (`Account`, `Credential`, `TwoFactorAuth`, `LeakedPasswordBloomFilter`, `ClientIntegrityAttestation`, `Session`, `StepUpAuthChallenge`, `AuditLog`).

### Limites declarados

- Repositórios, sessões e auditoria são em memória; a cadeia é síncrona.
- Hash de senha com scrypt (RFC 7914) nos parâmetros mínimos do OWASP, e não Argon2id: o Node não traz Argon2 no módulo `crypto` até a versão 22.
- A emissão do desafio de prova de trabalho e seu uso único não estão implementados; o elo só verifica a prova recebida.
- A demonstração reduz o custo do scrypt (N = 2^14) para rodar em poucos segundos; o padrão do código é N = 2^17.

### Testes

`npm run test:autenticacao` roda 56 testes com o `node:test` (arquivos em `tests/`): cada elo isolado, as duas cadeias completas e os vetores de teste da RFC 6238 para o TOTP.

Relatório da subequipe: [1.1.3. SubEquipe_03](https://unbarqdsw2026-2-turma01.github.io/2026.2-T01-_G6_ProjetoStreamingVideo_Entrega_03/#/Base/Relatórios/1.1.3.SubEquipe_03/README).

`npm test` executa as três suítes juntas: Observer da moderação (`src/**/*.test.ts`), autenticação e chat (`tests/*.test.ts`).

---

## 💬 Observer — Chat em Tempo Real (Philipe Amâncio Reis Caetano)

Sala de chat com o padrão **Observer**, integrada à moderação: a mensagem só é entregue aos observadores depois de passar pelo `AutoModPipeline`.

| Participante | Arquivo | O que faz |
| --- | --- | --- |
| Subject | `src/chat/ChatRoom.ts` | `subscribe`, `unsubscribe` e `publish`; notifica os observadores só quando a moderação aprova |
| Observer | `src/chat/ChatObserver.ts` | Contrato `update(message)` |
| ConcreteObserver | `src/chat/ChatDeliveryService.ts` | Entrega as mensagens aprovadas, exibindo-as no console |
| Moderação | `src/moderation/` | `AutoModPipeline`, `ModerationDecision` (aprovada, quarentena, rejeitada) e `ModerationVerdict` |
| Apoio | `src/chat/QuarantineQueue.ts`, `src/chat/ChatAuditService.ts`, `src/chat/ChatSetup.ts` | Fila de quarentena, auditoria de cada decisão e montagem das dependências |

```bash
npm run test:chat   # 5 testes: entrega, quarentena, rejeição, inscrição e cópias defensivas
```

