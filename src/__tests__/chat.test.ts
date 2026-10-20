import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ChatAuditService } from '../chat/ChatAuditService.js';
import { ChatMessage } from '../chat/ChatMessage.js';
import { ChatRoom } from '../chat/ChatRoom.js';
import { QuarantineQueue } from '../chat/QuarantineQueue.js';
import { ChatObserver } from '../chat/ChatObserver.js';
import { AutoModPipeline } from '../moderation/AutoModPipeline.js';
import { ModerationDecision } from '../moderation/ModerationDecision.js';

function createRoom(decision: ModerationDecision, reason = 'teste') {
  const audit = new ChatAuditService();
  const quarantine = new QuarantineQueue();
  const autoMod: AutoModPipeline = {
    inspectMessage: () => ({ decision, reason }),
  };

  return {
    room: new ChatRoom(autoMod, audit, quarantine),
    audit,
    quarantine,
  };
}

function createMessage(content = 'Olá'): ChatMessage {
  return new ChatMessage('message-1', 'channel-1', 'author-1', content);
}

test('entrega mensagens aprovadas aos observadores e registra auditoria', () => {
  const { room, audit, quarantine } = createRoom(ModerationDecision.APPROVED);
  const received: ChatMessage[] = [];
  const observer: ChatObserver = { update: (message) => received.push(message) };
  const message = createMessage();

  room.subscribe(observer);
  room.publish(message);

  assert.deepEqual(received, [message]);
  assert.equal(audit.getRecords().length, 1);
  assert.equal(audit.getRecords()[0].verdict.decision, ModerationDecision.APPROVED);
  assert.equal(quarantine.getEntries().length, 0);
});

test('envia mensagens em quarentena para a fila sem notificar observadores', () => {
  const { room, audit, quarantine } = createRoom(
    ModerationDecision.QUARANTINED,
    'conteúdo suspeito',
  );
  let deliveries = 0;

  room.subscribe({ update: () => { deliveries += 1; } });
  room.publish(createMessage('mensagem suspeita'));

  assert.equal(deliveries, 0);
  assert.equal(audit.getRecords().length, 1);
  assert.equal(quarantine.getEntries().length, 1);
  assert.equal(quarantine.getEntries()[0].verdict.reason, 'conteúdo suspeito');
});

test('não entrega mensagens rejeitadas, mas registra a decisão', () => {
  const { room, audit, quarantine } = createRoom(
    ModerationDecision.REJECTED,
    'conteúdo proibido',
  );
  let deliveries = 0;

  room.subscribe({ update: () => { deliveries += 1; } });
  room.publish(createMessage('mensagem proibida'));

  assert.equal(deliveries, 0);
  assert.equal(audit.getRecords()[0].verdict.decision, ModerationDecision.REJECTED);
  assert.equal(quarantine.getEntries().length, 0);
});

test('unsubscribe impede novas notificações e subscribe não duplica observadores', () => {
  const { room } = createRoom(ModerationDecision.APPROVED);
  let deliveries = 0;
  const observer: ChatObserver = { update: () => { deliveries += 1; } };

  room.subscribe(observer);
  room.subscribe(observer);
  room.unsubscribe(observer);
  room.publish(createMessage());

  assert.equal(deliveries, 0);
});

test('auditoria e quarentena armazenam cópias da mensagem', () => {
  const { room, audit, quarantine } = createRoom(ModerationDecision.QUARANTINED);
  const message = createMessage();

  room.publish(message);

  assert.notEqual(audit.getRecords()[0].message, message);
  assert.notEqual(quarantine.getEntries()[0].message, message);
  assert.equal(audit.getRecords()[0].message.content, 'Olá');
  assert.equal(quarantine.getEntries()[0].message.content, 'Olá');
});
