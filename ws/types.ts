import WebSocket from "ws";
import { ISession } from "../common/types";

export enum messageEvent {
  restore = 'restoreSession',
  prompt = 'prompt',
  tech = 'technical',
  promptAnswer = 'promptAnswer'
}

export enum techEvents {
  erase = 'eraseSession'
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
  event: 'text_stream' | 'stream_end';
  text: string;
  message_num: number;
}

export interface IAiClient {
  ws: WebSocket;
}