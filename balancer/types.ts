import { WebSocket } from "ws";
import { IRequest } from "../common/types";

export interface IqueueItem {
  aiClient: WebSocket;
  wsClient: WebSocket;
  request: IRequest;
}
