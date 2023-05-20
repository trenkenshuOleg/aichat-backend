import WebSocket from "ws";
import { ISession } from "../common/types";

export enum messageEvent {
  restore = 'restoreSession',
  prompt = 'prompt',
  tech = 'technical',
  promptAnswer = 'promptAnswer',
  queue = 'queue',
  ready = 'ready',
}

export enum techEvents {
  erase = 'eraseSession',
  regenerate = 'regenerate',
  goOn = 'goOn',
  ping = 'ping',
}

export enum streamEvents {
  stream = 'text_stream',
  end = 'stream_end'
}

export enum wsEvents {
  message = 'message',
  connect = 'connection',
  error = 'error'
}

export interface IClientMessage {
  event: messageEvent;
  payload: string | ISession;
  type?: string;
}

export interface IAiMessage {
  event: streamEvents;
  text: string;
  message_num: number;
}

export interface IAiClient {
  ws: WebSocket;
}