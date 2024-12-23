import { EventSource } from './source.types';
import { EventModeType, WebhookEventType } from '../constants';

export type CommonEventType =
  | WebhookEventType.Message
  | WebhookEventType.Unsend
  | WebhookEventType.Follow
  | WebhookEventType.Unfollow
  | WebhookEventType.Join
  | WebhookEventType.Leave
  | WebhookEventType.MemberJoined
  | WebhookEventType.MemberLeft
  | WebhookEventType.Postback
  | WebhookEventType.VideoPlayComplete
  | WebhookEventType.Beacon
  | WebhookEventType.AccountLink;

export type DeliveryContext = {
  isRedelivery: boolean;
};

export type CommonEvent = {
  type: CommonEventType;
  mode: EventModeType;
  timestamp: number;
  source?: EventSource;
  webhookEventId: string;
  deliveryContext: DeliveryContext;
};
