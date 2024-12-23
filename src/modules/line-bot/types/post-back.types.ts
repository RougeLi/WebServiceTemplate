import { PostbackParamsRichMenuStatus } from '../constants';

export type Postback = PostbackParamsDateTime | PostbackParamsRichMenu;

export type PostbackParamsDateTime =
  | { data: string }
  | { time: string }
  | { datetime: string };

export type PostbackParamsRichMenu = {
  newRichMenuAliasId?: string;
  status: PostbackParamsRichMenuStatus;
};
