import {Prompt} from 'prompt-sync';
import { IRequest, ISession } from "../common/types";
import { WebSocket } from 'ws';

export const getQuestion = (ws: WebSocket, session: ISession, prompt: Prompt): string => {
    const input = prompt('You say: ');
    if (input === '/q') {
      ws.close(1000);
      process.exit();
    }
    if (input === '/l') {
      console.log(session.sessionLog.join());
      getQuestion(ws, session, prompt);
    }
    if (input === '/purge') {
      console.log(`${session.sessionLog.join('')}`);
      getQuestion(ws, session, prompt);
    }
    const newEntry = '\n### Human:\n' + input;
    session.sessionLog.push(newEntry);
    return `Continue this conversation.${session.sessionLog.join('')}### Assistant:\n`
  }

  export const getAnswer = (websocket: WebSocket, req: IRequest): void => {
    const data = req.prompt.length > 2048 ? req.prompt.slice(-2048) : req.prompt;
    websocket.send(JSON.stringify({...req, prompt: data}));
  }