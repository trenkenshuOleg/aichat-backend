import WebSocket from "ws";
import { ISession } from "../common/types";

export enum wsEvent {
  restore = 'restoreSession',
  prompt = 'prompt',
  tech = 'technical',
  promptAnswer = 'promptAnswer'
}

export interface IClientMessage {
  event: wsEvent;
  payload: string | ISession;
  type?: string;
}

export interface IAiMessage {
  event: string;
  text: string;
  message_num: number;
}

export interface IAiClient {
  ws: WebSocket;
}