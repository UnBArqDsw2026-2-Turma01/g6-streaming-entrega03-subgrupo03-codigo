/**
 * ConcreteSubject (GoF / Profa. Milene Serrano - Slide 53)
 * Representa um canal de streaming UGC (User Generated Content) em plataformas
 * como YouTube Live, Kick.com ou Twitch.
 */
export class StreamChannel {
    channelId;
    streamerName;
    platform;
    status = 'OFFLINE';
    currentMetadata;
    observers = new Map();
    constructor(channelId, streamerName, platform = 'TWITCH', defaultCategory = 'Just Chatting') {
        this.channelId = channelId;
        this.streamerName = streamerName;
        this.platform = platform;
        const baseUrls = {
            TWITCH: `https://twitch.tv/${channelId}`,
            YOUTUBE_LIVE: `https://youtube.com/@${channelId}/live`,
            KICK: `https://kick.com/${channelId}`
        };
        this.currentMetadata = {
            channelId,
            streamerName,
            platform,
            title: 'Transmissão Offline',
            category: defaultCategory,
            tags: [],
            viewerCount: 0,
            streamUrl: baseUrls[platform]
        };
    }
    /**
     * GoF Subject: Retorna o estado atual do objeto observado (Slide 53)
     */
    getState() {
        return {
            status: this.status,
            metadata: { ...this.currentMetadata }
        };
    }
    getStatus() {
        return this.status;
    }
    getMetadata() {
        return { ...this.currentMetadata };
    }
    getObserversCount() {
        return this.observers.size;
    }
    /**
     * GoF Subject: Anexa um observador (attach)
     */
    attach(observer) {
        if (!this.observers.has(observer.id)) {
            this.observers.set(observer.id, observer);
        }
    }
    /**
     * GoF Subject: Desanexa um observador (detach)
     */
    detach(observerId) {
        return this.observers.delete(observerId);
    }
    /**
     * Inicia a transmissão ao vivo e notifica todos os observadores
     */
    async goLive(title, category, tags = ['gaming', 'pt-br'], viewerCount = 1, options = { mode: 'ASYNCHRONOUS_CONCURRENT' }) {
        this.status = 'LIVE';
        this.currentMetadata = {
            ...this.currentMetadata,
            title,
            category,
            tags,
            viewerCount,
            startedAt: new Date()
        };
        const event = {
            type: 'STREAM_STARTED',
            platform: this.platform,
            channelId: this.channelId,
            timestamp: new Date(),
            payload: { ...this.currentMetadata }
        };
        return this.notify(event, options);
    }
    /**
     * Atualiza os dados da transmissão (ex: mudou de jogo/categoria)
     */
    async updateMetadata(category, title, options = { mode: 'ASYNCHRONOUS_CONCURRENT' }) {
        if (this.status !== 'LIVE') {
            throw new Error('Não é possível atualizar metadados de um canal offline.');
        }
        if (category)
            this.currentMetadata.category = category;
        if (title)
            this.currentMetadata.title = title;
        const event = {
            type: 'STREAM_METADATA_UPDATED',
            platform: this.platform,
            channelId: this.channelId,
            timestamp: new Date(),
            payload: { ...this.currentMetadata }
        };
        return this.notify(event, options);
    }
    /**
     * Finaliza a transmissão ao vivo
     */
    async endLive(options = { mode: 'ASYNCHRONOUS_CONCURRENT' }) {
        this.status = 'ENDED';
        this.currentMetadata.endedAt = new Date();
        const event = {
            type: 'STREAM_ENDED',
            platform: this.platform,
            channelId: this.channelId,
            timestamp: new Date(),
            payload: { ...this.currentMetadata }
        };
        const report = await this.notify(event, options);
        this.status = 'OFFLINE';
        return report;
    }
    /**
     * GoF Subject: Notifica todos os observadores cadastrados
     * Suporta os modos Síncrono (bloqueante tradicional) e Assíncrono com Concorrência controlada
     */
    async notify(event, options = { mode: 'ASYNCHRONOUS_CONCURRENT' }) {
        const observerList = Array.from(this.observers.values());
        if (options.mode === 'SYNCHRONOUS_BLOCKING') {
            return this.notifySynchronously(observerList, event, options.detailedReport ?? false);
        }
        else {
            return this.notifyAsynchronously(observerList, event, options.concurrencyLimit ?? 100, options.detailedReport ?? false);
        }
    }
    /**
     * Implementação Síncrona / Bloqueante tradicional:
     * Corresponde à nota do Slide 53: "for each view in views: v.update()"
     */
    async notifySynchronously(observers, event, detailed) {
        const startTime = performance.now();
        const results = [];
        let successful = 0;
        let failed = 0;
        for (const observer of observers) {
            const obsStart = performance.now();
            try {
                await observer.update(event);
                successful++;
                if (detailed) {
                    results.push({
                        observerId: observer.id,
                        observerName: observer.name,
                        platformTarget: observer.targetSystem,
                        success: true,
                        durationMs: performance.now() - obsStart
                    });
                }
            }
            catch (err) {
                failed++;
                if (detailed) {
                    results.push({
                        observerId: observer.id,
                        observerName: observer.name,
                        platformTarget: observer.targetSystem,
                        success: false,
                        durationMs: performance.now() - obsStart,
                        error: err instanceof Error ? err.message : String(err)
                    });
                }
            }
        }
        const elapsed = performance.now() - startTime;
        return {
            eventType: event.type,
            platform: this.platform,
            totalObservers: observers.length,
            successful,
            failed,
            dispatchDurationMs: elapsed,
            totalDeliveryDurationMs: elapsed,
            mode: 'SYNCHRONOUS_BLOCKING',
            results: detailed ? results : undefined
        };
    }
    /**
     * Implementação Assíncrona Concorrente (Iniciativa Extra da SubEquipe 03):
     * Worker Pool pattern / Promise chunking com alta vazão e isolamento de falhas.
     */
    async notifyAsynchronously(observers, event, concurrencyLimit, detailed) {
        const startOverall = performance.now();
        const results = [];
        let successful = 0;
        let failed = 0;
        for (let i = 0; i < observers.length; i += concurrencyLimit) {
            const chunk = observers.slice(i, i + concurrencyLimit);
            const chunkPromises = chunk.map(async (observer) => {
                const obsStart = performance.now();
                try {
                    await observer.update(event);
                    return {
                        observerId: observer.id,
                        observerName: observer.name,
                        platformTarget: observer.targetSystem,
                        success: true,
                        durationMs: performance.now() - obsStart
                    };
                }
                catch (err) {
                    return {
                        observerId: observer.id,
                        observerName: observer.name,
                        platformTarget: observer.targetSystem,
                        success: false,
                        durationMs: performance.now() - obsStart,
                        error: err instanceof Error ? err.message : String(err)
                    };
                }
            });
            const chunkResults = await Promise.allSettled(chunkPromises);
            for (const res of chunkResults) {
                if (res.status === 'fulfilled') {
                    if (res.value.success)
                        successful++;
                    else
                        failed++;
                    if (detailed)
                        results.push(res.value);
                }
                else {
                    failed++;
                }
            }
        }
        const totalDuration = performance.now() - startOverall;
        return {
            eventType: event.type,
            platform: this.platform,
            totalObservers: observers.length,
            successful,
            failed,
            dispatchDurationMs: totalDuration / Math.max(1, (observers.length / concurrencyLimit)),
            totalDeliveryDurationMs: totalDuration,
            mode: 'ASYNCHRONOUS_CONCURRENT',
            results: detailed ? results : undefined
        };
    }
}
