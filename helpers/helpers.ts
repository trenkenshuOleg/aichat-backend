import dbClient from "../api/db_api";
import { ILogMessage, IRequest, ISession } from "../common/types";
import { WebSocket } from 'ws';

const prompt = async (msg: string): Promise<string> => {
  return (new Promise((resolve: (val: string) => void, reject: (e: Error) => void): void => {
    process.stdout.write(msg);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (val) => {
      process.stdin.pause();
      resolve(String(val).trim());
    });
  })).catch((e: Error) => {
    process.stdin.pause();
    return Promise.reject(e.message);
  });
};

export const getQuestion = async (ws: WebSocket, session: ISession): Promise<string> => {
  const input = await prompt('You say: ');
  if (input === '/q') {
    ws.close(1000);
    process.exit();
  }
  if (input === '/l') {
    console.log(session.sessionLog.map(el => `${el.sender}: ${el.message}\n`).join(''));
    return getQuestion(ws, session);
  }
  /* TODO or discard */
  if (input === '/purge') {
    dbClient.purge(session.userId);
    session.sessionLog = [];
    return getQuestion(ws, session);
  }
  const newEntry: ILogMessage = {
    sender: 'Human',
    message: input,
  };
  session.sessionLog.push(newEntry);
  let history = '';
  session.sessionLog.forEach(item => {
    history += `\n### ${item.sender}:\n${item.message}`;
  });
  const requestWithHistory =
    ('Continue the dialogue properly. Say hello and offer your help'
      + history
      + '/n ### Assistant:\n')

  return requestWithHistory
}

export const getAnswer = (websocket: WebSocket, req: IRequest): void => {
  const data = req.prompt.length > 2048 ? req.prompt.slice(-2048) : req.prompt;
  websocket.send(JSON.stringify({ ...req, prompt: data }));
}

export const generateId = async () => {
  const id = String(
    parseInt(Math.random().toString().slice(-10)).toString(16)
    + process.env.SECRET + parseInt(Math.random().toString().slice(-10)).toString(16)
    + process.env.SECRET2 + parseInt(Math.random().toString().slice(-10)).toString(16));
  const match = await dbClient.get(id);
  if (match === null)
    return id;
  generateId();
}

export const isId = (isItId: string) => {
  return isItId.slice(8, 14) === process.env.SECRET && isItId.slice(-11, -8) === process.env.SECRET2
}