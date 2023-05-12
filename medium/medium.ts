import WebSocket from "ws";
import { EventEmitter } from "node:events";
import { request } from "../common/constants";
import { IAiMessage } from "../ws/types";
import { ISession } from "../common/types";

const medium = new EventEmitter;

medium.on('promp', async (clientSocket: WebSocket, aiSocket: WebSocket, session: ISession, prompt: string) => {
  if (aiSocket.readyState === WebSocket.OPEN) {
    const requestWithHistory = (session.sessionLog + '\n### Human:\n' + prompt).slice(-2048);
    aiSocket.send(JSON.stringify({ ...request, prompt: requestWithHistory }));
    aiSocket.on('message', (data: string) =>
      medium.emit('promptAnswer', clientSocket, data)
    )
  }
})

medium.on('promptAnswer', (clientSocket: WebSocket, data: string) => {
  // const chunk: IAiMessage = JSON.parse(data);
  if (clientSocket.readyState === WebSocket.OPEN) {
    clientSocket.send(data);
  }
})

export default medium;