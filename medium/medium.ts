import WebSocket from "ws";
import { EventEmitter } from "node:events";
import { request } from "../common/constants";
import { IAiMessage, IClientMessage, messageEvent } from "../ws/types";
import { ISession } from "../common/types";

// Medium between client and AI to transfer prompts and answers between the two
const medium = new EventEmitter;

// Passing the prompt from client to AI
medium.on(messageEvent.prompt, async (aiSocket: WebSocket, session: ISession) => {
  if (aiSocket.readyState === WebSocket.OPEN) {
    let history = '';
    session.sessionLog.forEach(item => {
      history += `\n### ${item.sender}:\n${item.message}`;
    });
    const requestWithHistory =
      ('Continue the dialogue properly.'
        + history
        + '/n ### Assistant:\n')
        .slice(-2048);
    aiSocket.send(JSON.stringify({ ...request, prompt: requestWithHistory }));
  }
})

// Streaming answer from AI to client
medium.on(messageEvent.promptAnswer, (clientSocket: WebSocket, data: string) => {
  const chunk: IAiMessage = JSON.parse(data);
  const msgType: string = chunk.event;
  const toSend: IClientMessage = {
    event: messageEvent.promptAnswer,
    payload: chunk.text,
    type: msgType
  }
  console.log('medium promptAnswer', chunk);
  if (clientSocket.readyState === WebSocket.OPEN) {
    clientSocket.send(JSON.stringify(toSend));
  }
})

export default medium;