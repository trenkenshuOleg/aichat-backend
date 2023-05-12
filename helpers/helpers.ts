import { IRequest, ISession } from "../common/types";
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
    console.log(session.sessionLog.join());
    getQuestion(ws, session);
  }
  /* TODO or discard */
  if (input === '/purge') {
    console.log(`${session.sessionLog.join('')}`);
    getQuestion(ws, session);
  }
  const newEntry = '\n### Human:\n' + input;
  session.sessionLog.push(newEntry);
  return `Continue this conversation.${session.sessionLog.join('')}### Assistant:\n`
}

export const getAnswer = (websocket: WebSocket, req: IRequest): void => {
  const data = req.prompt.length > 2048 ? req.prompt.slice(-2048) : req.prompt;
  websocket.send(JSON.stringify({ ...req, prompt: data }));
}

export const generateId = () => {
  return String(
    parseInt(Math.random().toString().slice(-10)).toString(16)
    + process.env.SECRET + parseInt(Math.random().toString().slice(-10)).toString(16)
    + process.env.SECRET2 + parseInt(Math.random().toString().slice(-10)).toString(16))
}