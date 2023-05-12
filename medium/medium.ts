import WebSocket from "ws";
import { EventEmitter } from "node:events";
import { request } from "../common/constants";
import { IAiMessage, IClientMessage, wsEvent } from "../ws/types";
import { ISession } from "../common/types";

const medium = new EventEmitter;

medium.on(wsEvent.prompt, async (clientSocket: WebSocket, aiSocket: WebSocket, session: ISession, prompt: string) => {
  if (aiSocket.readyState === WebSocket.OPEN) {
    console.log('medium prompt', prompt);
    const requestWithHistory = (session.sessionLog + '\n### Human:\n' + prompt).slice(-2048);
    aiSocket.send(JSON.stringify({ ...request, prompt: requestWithHistory }));
  }
})

medium.on('promptAnswer', (clientSocket: WebSocket, data: string) => {
  const chunk: IAiMessage = JSON.parse(data);
  const msgType: string = chunk.event;
  const toSend: IClientMessage = {
    event: wsEvent.promptAnswer,
    payload: chunk.text,
    type: msgType
  }
  console.log('medium promptAnswer', chunk);
  if (clientSocket.readyState === WebSocket.OPEN) {
    clientSocket.send(JSON.stringify(toSend));
  }
})

export default medium;