import WebSocket from "ws";
import { IRequest } from "../common/types";
import { IAiClient } from "./types";
import dbClient from "../api/db_api";
import { session } from "../common/constants";
import medium from "../medium/medium";

// WebSocket decorator for http clients

export class aiClient implements IAiClient {
  ws: WebSocket;
  constructor(url: string) {
    this.ws = new WebSocket(url);
  }
  send(data: IRequest) {
    if (this.ws.readyState === WebSocket.OPEN)
      this.ws.send(JSON.stringify(data));
  }
}