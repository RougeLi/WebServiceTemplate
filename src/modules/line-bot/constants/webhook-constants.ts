export enum EventModeType {
  Active = 'active',
  Standby = 'standby',
}

export enum SourceType {
  User = 'user',
  Group = 'group',
  Room = 'room',
}

export enum WebhookEventType {
  Message = 'message',
  Unsend = 'unsend',
  Follow = 'follow',
  Unfollow = 'unfollow',
  Join = 'join',
  Leave = 'leave',
  MemberJoined = 'memberJoined',
  MemberLeft = 'memberLeft',
  Postback = 'postback',
  VideoPlayComplete = 'videoPlayComplete',
  Beacon = 'beacon',
  AccountLink = 'accountLink',
}

export enum MessageEventMessageType {
  Text = 'text',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  File = 'file',
  Location = 'location',
  Sticker = 'sticker',
}

export enum MentionType {
  User = 'user',
  All = 'all',
}

export enum StickerResourceType {
  Static = 'STATIC',
  Animated = 'ANIMATED',
  Sound = 'SOUND',
  AnimationSound = 'ANIMATION_SOUND',
  Popup = 'POPUP',
  PopupSound = 'POPUP_SOUND',
  Custom = 'CUSTOM',
  Message = 'MESSAGE',
  NameText = 'NAME_TEXT',
  PerStickerText = 'PER_STICKER_TEXT',
}

export enum ContentProviderType {
  Line = 'line',
  External = 'external',
}

export enum PostbackParamsRichMenuStatus {
  Success = 'SUCCESS',
  RichMenuAliasIdNotFound = 'RICHMENU_ALIAS_ID_NOTFOUND',
  RichMenuNotFound = 'RICHMENU_NOTFOUND',
  Failed = 'FAILED',
}

export enum BeaconType {
  Enter = 'enter',
  Banner = 'banner',
  Stay = 'stay',
}

export enum LinkResult {
  Ok = 'ok',
  Failed = 'failed',
}
