const assert = require("node:assert/strict");
const test = require("node:test");

const { ChatAuditService } = require("../.test-build/chat/ChatAuditService");
const { ChatMessage } = require("../.test-build/chat/ChatMessage");
const { ChatRoom } = require("../.test-build/chat/ChatRoom");
const { QuarantineQueue } = require("../.test-build/chat/QuarantineQueue");
const { ModerationDecision } = require("../.test-build/moderation/ModerationDecision");

function createRoom(decision, reason = "teste") {
  const audit = new ChatAuditService();
  const quarantine = new QuarantineQueue();
  const autoMod = {
    inspectMessage: () => ({ decision, reason }),
  };

  return {
    room: new ChatRoom(autoMod, audit, quarantine),
    audit,
    quarantine,
  };
}

function createMessage(content = "Olá") {
  return new ChatMessage("message-1", "channel-1", "author-1", content);
}

test("entrega mensagens aprovadas aos observadores e registra auditoria", () => {
  const { room, audit, quarantine } = createRoom(ModerationDecision.APPROVED);
  const received = [];
  const observer = { update: (message) => received.push(message) };

  room.subscribe(observer);
  const message = createMessage();
  room.publish(message);

  assert.deepEqual(received, [message]);
  assert.equal(audit.getRecords().length, 1);
  assert.equal(audit.getRecords()[0].verdict.decision, ModerationDecision.APPROVED);
  assert.equal(quarantine.getEntries().length, 0);
});

test("envia mensagens em quarentena para a fila sem notificar observadores", () => {
  const { room, audit, quarantine } = createRoom(ModerationDecision.QUARANTINED, "conteúdo suspeito");
  let deliveries = 0;

  room.subscribe({ update: () => { deliveries += 1; } });
  room.publish(createMessage("mensagem suspeita"));

  assert.equal(deliveries, 0);
  assert.equal(audit.getRecords().length, 1);
  assert.equal(quarantine.getEntries().length, 1);
  assert.equal(quarantine.getEntries()[0].verdict.reason, "conteúdo suspeito");
});

test("não entrega mensagens rejeitadas, mas registra a decisão", () => {
  const { room, audit, quarantine } = createRoom(ModerationDecision.REJECTED, "conteúdo proibido");
  let deliveries = 0;

  room.subscribe({ update: () => { deliveries += 1; } });
  room.publish(createMessage("mensagem proibida"));

  assert.equal(deliveries, 0);
  assert.equal(audit.getRecords()[0].verdict.decision, ModerationDecision.REJECTED);
  assert.equal(quarantine.getEntries().length, 0);
});

test("unsubscribe impede novas notificações e subscribe não duplica observadores", () => {
  const { room } = createRoom(ModerationDecision.APPROVED);
  let deliveries = 0;
  const observer = { update: () => { deliveries += 1; } };

  room.subscribe(observer);
  room.subscribe(observer);
  room.unsubscribe(observer);
  room.publish(createMessage());

  assert.equal(deliveries, 0);
});

test("auditoria e quarentena não expõem referências mutáveis da mensagem", () => {
  const { room, audit, quarantine } = createRoom(ModerationDecision.QUARANTINED);
  const message = createMessage();

  room.publish(message);
  message.content = "alterada";

  assert.equal(audit.getRecords()[0].message.content, "Olá");
  assert.equal(quarantine.getEntries()[0].message.content, "Olá");
});
