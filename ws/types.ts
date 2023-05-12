import WebSocket from "ws";
import { ISession } from "../common/types";

export enum wsEvent {
  restore = 'restoreSession',
  prompt = 'prompt',
  tech = 'technical',
}

export interface IClientMessage {
  event: wsEvent;
  payload: string | ISession;
}

export interface IAiMessage {
  event: string;
  payload: string;
}

export interface IAiClient {
  ws: WebSocket;
}