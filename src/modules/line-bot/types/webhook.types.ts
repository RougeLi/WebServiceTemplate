import { CommonEvent } from './event.types';
import { MessageEventMessage } from './message.types';
import { Postback } from './post-back.types';
import { SourceUser } from './source.types';
import { BeaconType, LinkResult, WebhookEventType } from '../constants';

export type WebhookRequestBody = {
  destination: string;
  events: Events[];
};

type Events =
  | MessageEvent
  | UnsendEvent
  | FollowEvent
  | UnfollowEvent
  | JoinEvent
  | LeaveEvent
  | MemberJoinEvent
  | MemberLeaveEvent
  | PostbackEvent
  | VideoPlayCompleteEvent
  | BeaconEvent
  | AccountLinkEvent;

export type MessageEvent = CommonEvent & {
  type: WebhookEventType.Message;
  message: MessageEventMessage;
};

export type UnsendEvent = CommonEvent & {
  type: WebhookEventType.Unsend;
  unsend: {
    messageId: string;
  };
};

export type FollowEvent = CommonEvent & {
  type: WebhookEventType.Follow;
  replyToken: string;
  follow: {
    isUnblocked: boolean;
  };
};

export type UnfollowEvent = CommonEvent & {
  type: WebhookEventType.Unfollow;
};

export type JoinEvent = CommonEvent & {
  type: WebhookEventType.Join;
  replyToken: string;
};

export type LeaveEvent = CommonEvent & {
  type: WebhookEventType.Leave;
};

export type MemberJoinEvent = CommonEvent & {
  type: WebhookEventType.MemberJoined;
  joined: {
    members: SourceUser[];
  };
  replyToken: string;
};

export type MemberLeaveEvent = CommonEvent & {
  type: WebhookEventType.MemberLeft;
  left: {
    members: SourceUser[];
  };
};

export type PostbackEvent = CommonEvent & {
  type: WebhookEventType.Postback;
  replyToken: string;
  postback: Postback;
};

export type VideoPlayCompleteEvent = CommonEvent & {
  type: WebhookEventType.VideoPlayComplete;
  replyToken: string;
  videoPlayComplete: {
    trackingId: string;
  };
};

export type BeaconEvent = CommonEvent & {
  type: WebhookEventType.Beacon;
  replyToken: string;
  beacon: {
    hwid: string;
    type: BeaconType;
    dm?: string;
  };
};

export type AccountLinkEvent = CommonEvent & {
  type: WebhookEventType.AccountLink;
  replyToken?: string;
  link: {
    result: LinkResult;
    nonce: string;
  };
};
