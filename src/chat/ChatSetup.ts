import type { AutoModPipeline } from "../moderation/AutoModPipeline";

import { ChatAuditService } from "./ChatAuditService";
import { ChatDeliveryService } from "./ChatDeliveryService";
import { ChatRoom } from "./ChatRoom";
import { QuarantineQueue } from "./QuarantineQueue";

export interface ConfiguredChat {
  readonly room: ChatRoom;
  readonly audit: ChatAuditService;
  readonly quarantine: QuarantineQueue;
  readonly delivery: ChatDeliveryService;
}

export class ChatSetup {
  constructor(
    private readonly autoMod: AutoModPipeline,
  ) {}

  public configureChat(): ConfiguredChat {
    const audit = new ChatAuditService();
    const quarantine = new QuarantineQueue();
    const delivery = new ChatDeliveryService();

    const room = new ChatRoom(
      this.autoMod,
      audit,
      quarantine,
    );

    room.subscribe(delivery);

    return {
      room,
      audit,
      quarantine,
      delivery,
    };
  }
}