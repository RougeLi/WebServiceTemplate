import { WebhookRequest, WebhookEvent } from '@prisma/client';
import { LoggerService, PrismaService } from 'src/core/services';
import { WebhookEventType } from '../constants';
import {
  AccountLinkEvent,
  BeaconEvent,
  CommonEvent,
  FollowEvent,
  JoinEvent,
  MemberJoinEvent,
  MemberLeaveEvent,
  MessageEvent,
  PostbackEvent,
  UnsendEvent,
  VideoPlayCompleteEvent,
} from '../types';

export default class WebhookModel {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async handleWebhook(
    destination: string,
    events: CommonEvent[],
  ): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      const webhookRequest = await prisma.webhookRequest.create({
        data: {
          destination,
        },
      });

      for (const event of events) {
        const webhookEvent = await prisma.webhookEvent.create({
          data: {
            requestId: webhookRequest.id,
            type: event.type,
            mode: event.mode,
            timestamp: event.timestamp,
            source: event.source || {},
            deliveryContext: event.deliveryContext,
            webhookEventId: event.webhookEventId,
          },
        });

        switch (event.type) {
          case WebhookEventType.Message:
            await this.createMessageEvent(
              webhookEvent.id,
              event as MessageEvent,
            );
            break;

          case WebhookEventType.Unsend:
            await this.createUnsendEvent(webhookEvent.id, event as UnsendEvent);
            break;

          case WebhookEventType.Follow:
            await this.createFollowEvent(webhookEvent.id, event as FollowEvent);
            break;

          case WebhookEventType.Join:
            await this.createJoinEvent(webhookEvent.id, event as JoinEvent);
            break;

          case WebhookEventType.MemberJoined:
            await this.createMemberJoinEvent(
              webhookEvent.id,
              event as MemberJoinEvent,
            );
            break;

          case WebhookEventType.MemberLeft:
            await this.createMemberLeaveEvent(
              webhookEvent.id,
              event as MemberLeaveEvent,
            );
            break;

          case WebhookEventType.Postback:
            await this.createPostbackEvent(
              webhookEvent.id,
              event as PostbackEvent,
            );
            break;

          case WebhookEventType.VideoPlayComplete:
            await this.createVideoPlayCompleteEvent(
              webhookEvent.id,
              event as VideoPlayCompleteEvent,
            );
            break;

          case WebhookEventType.Beacon:
            await this.createBeaconEvent(webhookEvent.id, event as BeaconEvent);
            break;

          case WebhookEventType.AccountLink:
            await this.createAccountLinkEvent(
              webhookEvent.id,
              event as AccountLinkEvent,
            );
            break;

          default:
            this.logger.warn(`Unknown event type: ${event.type}`);
        }
      }
    });
  }

  async createWebhookRequest(destination: string): Promise<WebhookRequest> {
    return this.prisma.webhookRequest.create({
      data: {
        destination,
      },
    });
  }

  async createWebhookEvent(
    requestId: number,
    event: CommonEvent,
  ): Promise<WebhookEvent> {
    return this.prisma.webhookEvent.create({
      data: {
        requestId,
        type: event.type,
        mode: event.mode,
        timestamp: event.timestamp,
        source: event.source || {},
        webhookEventId: event.webhookEventId,
        deliveryContext: event.deliveryContext,
      },
    });
  }

  async createMessageEvent(
    eventId: number,
    event: MessageEvent,
  ): Promise<void> {
    await this.prisma.messageEvent.create({
      data: {
        eventId,
        messageId: event.message.id,
        messageType: event.message.type,
        message: event.message,
      },
    });
  }

  async createUnsendEvent(eventId: number, event: UnsendEvent): Promise<void> {
    await this.prisma.unsendEvent.create({
      data: {
        eventId,
        detail: event.unsend,
      },
    });
  }

  async createFollowEvent(eventId: number, event: FollowEvent): Promise<void> {
    await this.prisma.followEvent.create({
      data: {
        eventId,
        detail: {
          replyToken: event.replyToken,
          follow: event.follow,
        },
      },
    });
  }

  async createJoinEvent(eventId: number, event: JoinEvent): Promise<void> {
    await this.prisma.joinEvent.create({
      data: {
        eventId,
        detail: {
          replyToken: event.replyToken,
        },
      },
    });
  }

  async createMemberJoinEvent(
    eventId: number,
    event: MemberJoinEvent,
  ): Promise<void> {
    await this.prisma.memberJoinEvent.create({
      data: {
        eventId,
        detail: {
          joined: event.joined,
          replyToken: event.replyToken,
        },
      },
    });
  }

  async createMemberLeaveEvent(
    eventId: number,
    event: MemberLeaveEvent,
  ): Promise<void> {
    await this.prisma.memberLeaveEvent.create({
      data: {
        eventId,
        detail: {
          left: event.left,
        },
      },
    });
  }

  async createPostbackEvent(
    eventId: number,
    event: PostbackEvent,
  ): Promise<void> {
    await this.prisma.postbackEvent.create({
      data: {
        eventId,
        detail: {
          replyToken: event.replyToken,
          postback: event.postback,
        },
      },
    });
  }

  async createVideoPlayCompleteEvent(
    eventId: number,
    event: VideoPlayCompleteEvent,
  ): Promise<void> {
    await this.prisma.videoPlayCompleteEvent.create({
      data: {
        eventId,
        detail: {
          replyToken: event.replyToken,
          videoPlayComplete: event.videoPlayComplete,
        },
      },
    });
  }

  async createBeaconEvent(eventId: number, event: BeaconEvent): Promise<void> {
    await this.prisma.beaconEvent.create({
      data: {
        eventId,
        detail: {
          replyToken: event.replyToken,
          beacon: event.beacon,
        },
      },
    });
  }

  async createAccountLinkEvent(
    eventId: number,
    event: AccountLinkEvent,
  ): Promise<void> {
    await this.prisma.accountLinkEvent.create({
      data: {
        eventId,
        detail: {
          replyToken: event.replyToken,
          link: event.link,
        },
      },
    });
  }
}
