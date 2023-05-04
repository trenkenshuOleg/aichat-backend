import WebSocket from 'ws';
import { request } from './common/constants';
import * as dotenv from 'dotenv';
import promptSync from 'prompt-sync';
import { IRequest } from './common/types';

dotenv.config();

const api = process.env.API_URL || 'ws://localhost';
const myPort = Number(process.env.SERVER_PORT) || 8080;
const prompt = promptSync();
let answer = '';
const session: Record<string, string> = {
  chatHistory: '',
}

const getQuestion = (ws?: WebSocket): string => {
  const input = prompt('You say: ');
  if (input === '/quit' && ws) {
    ws.close(1000);
    process.exit();
  }
  session.chatHistory += '### Human:\n' + input;
  return `Write a response that appropriately completes the request.\n${session.chatHistory}\n### Assistant:\n`
}

const getAnswer = (req: IRequest, websocket: WebSocket): void => {
  websocket.send(JSON.stringify(req));
}

console.log(`Starting WebSocket connection to ${api}...`);

// WS Client

const ai = new WebSocket(api);

ai.on('open', (ws: WebSocket) => {
  console.log(`Connected to ${api}`);
  request.prompt = getQuestion(ai);
  getAnswer(request, ai);
})

ai.on('message', (event: WebSocket.MessageEvent) => {
  const msg = JSON.parse(event as any as string)
  if(msg.event !== 'stream_end') {
    answer += msg.text;
    console.log(answer);
  } else {
    session.chatHistory += '\n### Assistant:\n' + answer;
    answer = '\n';
    console.log('Once again: ')
    request.prompt = getQuestion(ai);
    getAnswer(request, ai);
  }
});

ai.on('ping', (ws: WebSocket) => {
  ai.pong('ok', true);
});

ai.on('error', (err: WebSocket.ErrorEvent) => {console.log(err.message)});








