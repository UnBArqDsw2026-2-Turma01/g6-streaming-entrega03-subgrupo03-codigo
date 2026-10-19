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
cd docs/Base/Relatórios/1.1.3.SubEquipe_03/codigo
npm install
```

### Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run demo` | Executa a demonstração interativa de streaming e moderação reativa (ideal para o vídeo) |
| `npm run benchmark` | Executa o teste de carga comparativo com 2.000 espectadores (Iniciativa Extra) |
| `npm test` | Executa a suíte de 13 testes unitários automatizados (Node Test Runner) |
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
