import {
  ContentProviderType,
  MentionType,
  MessageEventMessageType,
  StickerResourceType,
} from '../constants';

export type MessageEventMessage =
  | MessageText
  | MessageImage
  | MessageVideo
  | MessageAudio
  | MessageFile
  | MessageLocation
  | MessageSticker;

export type MessageText = {
  id: string;
  type: MessageEventMessageType.Text;
  quoteToken: string;
  text: string;
  emojis?: Emoji[];
  mention?: Mention;
};

export type MessageImage = {
  id: string;
  type: MessageEventMessageType.Image;
  quoteToken: string;
  contentProvider: ContentProvider;
  imageSet?: ImageSet;
};

export type MessageVideo = {
  id: string;
  type: MessageEventMessageType.Video;
  quoteToken: string;
  duration?: number;
  contentProvider: ContentProvider;
};

export type MessageAudio = {
  id: string;
  type: MessageEventMessageType.Audio;
  duration: number;
  contentProvider: ContentProvider;
};

export type MessageFile = {
  id: string;
  type: MessageEventMessageType.File;
  fileName: string;
  fileSize: number;
};

export type MessageLocation = {
  id: string;
  type: MessageEventMessageType.Location;
  title?: string;
  address?: string;
  latitude: number;
  longitude: number;
};

export type MessageSticker = {
  id: string;
  type: MessageEventMessageType.Sticker;
  quoteToken: string;
  packageId: string;
  stickerId: string;
  stickerResourceType?: StickerResourceType;
  keywords?: string[];
  text?: string;
  quotedMessageId?: string;
};

export type ContentProvider = {
  type: ContentProviderType;
  originalContentUrl?: string;
  previewImageUrl?: string;
};

export type ImageSet = {
  id?: string;
  index?: number;
  total?: number;
};

export type Emoji = {
  index: number;
  length: number;
  productId: string;
  emojiId: string;
};

export type Mention = {
  mentionees: {
    index: number;
    length: number;
    type: MentionType;
    userId?: string;
    isSelf?: boolean;
    quotedMessageId?: string;
  }[];
};
