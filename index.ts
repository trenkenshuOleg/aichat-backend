import * as dotenv from 'dotenv';
dotenv.config();
import dbClient from './api/db_api';
import { api } from './ws/ai_console_client'
import wsServer from './ws/server';

console.log(`Starting WebSocket connection to ${api}...`,);
const server = new wsServer(Number(process.env.SERVER_PORT));
process.on('warning', console.warn);

