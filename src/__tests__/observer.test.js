import { describe, it } from 'node:test';
import assert from 'node:assert';
import { StreamChannel } from '../patterns/observer/StreamChannel.js';
class MockObserver {
    id;
    name;
    receivedEvents = [];
    shouldFail = false;
    targetSystem = 'Mock Unit Test System';
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
    update(event) {
        if (this.shouldFail) {
            throw new Error(`Simulated failure for ${this.name}`);
        }
        this.receivedEvents.push(event);
    }
}
describe('Padrão GoF Observer Multiplataforma - Testes Unitários (SubEquipe 03)', () => {
    it('deve anexar (attach) e desanexar (detach) observadores em um canal do YouTube Live', () => {
        const channel = new StreamChannel('cazetv', 'CazéTV', 'YOUTUBE_LIVE');
        const obs1 = new MockObserver('obs-yt-1', 'YouTube Observer 1');
        const obs2 = new MockObserver('obs-yt-2', 'YouTube Observer 2');
        assert.strictEqual(channel.getObserversCount(), 0);
        channel.attach(obs1);
        channel.attach(obs2);
        assert.strictEqual(channel.getObserversCount(), 2);
        const detached = channel.detach(obs1.id);
        assert.strictEqual(detached, true);
        assert.strictEqual(channel.getObserversCount(), 1);
        const detachNonExistent = channel.detach('inexistente');
        assert.strictEqual(detachNonExistent, false);
    });
    it('deve notificar observadores com metadados corretos na Kick.com (goLive)', async () => {
        const channel = new StreamChannel('coringa', 'Victor Coringa', 'KICK');
        const obs = new MockObserver('obs-kick-1', 'Kick Pusher Listener');
        channel.attach(obs);
        const report = await channel.goLive('GTA RP AO VIVO NA CIDADE ALTA', 'GTA V', ['gtarp', 'kick'], 35000);
        assert.strictEqual(channel.getStatus(), 'LIVE');
        assert.strictEqual(report.platform, 'KICK');
        assert.strictEqual(report.successful, 1);
        assert.strictEqual(report.failed, 0);
        assert.strictEqual(obs.receivedEvents.length, 1);
        assert.strictEqual(obs.receivedEvents[0].platform, 'KICK');
        assert.strictEqual(obs.receivedEvents[0].payload.streamUrl, 'https://kick.com/coringa');
    });
    it('deve atualizar metadados dinamicamente na Twitch (updateMetadata)', async () => {
        const channel = new StreamChannel('gaules', 'Gaules', 'TWITCH');
        const obs = new MockObserver('obs-gau-1', 'Twitch EventSub Listener');
        channel.attach(obs);
        await channel.goLive('Iniciando com CS2', 'Counter-Strike 2');
        await channel.updateMetadata('Valorant', 'Agora um pouco de Valorant!');
        assert.strictEqual(obs.receivedEvents.length, 2);
        assert.strictEqual(obs.receivedEvents[1].type, 'STREAM_METADATA_UPDATED');
        assert.strictEqual(obs.receivedEvents[1].payload.category, 'Valorant');
    });
    it('deve isolar falhas de observadores sem interromper a transmissão (Fault Isolation)', async () => {
        const channel = new StreamChannel('multistreamer', 'Criador Multiplataforma', 'YOUTUBE_LIVE');
        const goodObs = new MockObserver('obs-bom', 'Good Observer');
        const badObs = new MockObserver('obs-ruim', 'Failing Observer');
        badObs.shouldFail = true;
        channel.attach(goodObs);
        channel.attach(badObs);
        const report = await channel.goLive('Live Multiplataforma', 'Technology');
        assert.strictEqual(report.totalObservers, 2);
        assert.strictEqual(report.successful, 1);
        assert.strictEqual(report.failed, 1);
        assert.strictEqual(goodObs.receivedEvents.length, 1);
    });
});
