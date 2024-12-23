import { SourceType } from '../constants';

export type SourceUser = {
  type: SourceType.User;
  userId: string;
};

export type SourceGroup = {
  type: SourceType.Group;
  groupId: string;
  userId?: string;
};

export type SourceRoom = {
  type: SourceType.Room;
  roomId: string;
  userId?: string;
};

export type EventSource = SourceUser | SourceGroup | SourceRoom;
