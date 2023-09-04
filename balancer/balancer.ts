import { WebSocket } from "ws";
import { IRequest } from "../common/types";
import { IqueueItem } from "./types";
import { IAiMessage, IClientMessage, messageEvent, streamEvents, techEvents, wsEvents } from "../ws/types";

export class Balancer {
  private queue: IqueueItem[];
  private working: WebSocket[];
  private maxLoad: number;

  constructor(max: number) {
    this.maxLoad = max;
    this.queue = [];
    this.working = [];
  }

  public addItem(aiClient: WebSocket, wsClient: WebSocket, request: IRequest) {
    const item: IqueueItem = {
      aiClient,
      wsClient,
      request,
    };
    if (this.working.length < this.maxLoad) {
      this.run(item)
    } else {
      const isInQueue = this.queue.some(alreadyThere => alreadyThere.aiClient === item.aiClient);
      if (!isInQueue) {
        this.queue.push(item);
        const wait: IClientMessage = {
          event: messageEvent.queue,
          payload: String(this.queue.indexOf(item))
        }
        wsClient.send(JSON.stringify(wait));
        console.log('new in working', this.working.length, 'waiting', this.queue.length)
      }
    }
    // console.log(this.queue);
  }

  private run = (item: IqueueItem) => {
    item.aiClient.send(JSON.stringify(item.request));
    this.working.push(item.aiClient);
    const getNextAndRun = () => {
      this.working = this.working.filter(elem => elem !== item.aiClient);
      if (this.queue.length) {
        const next = this.queue.shift();
        let restQue = [...this.queue];
        if (next) {
          this.run(next);
          restQue = [...this.queue, next];
        }
        restQue.forEach(queued => {
          const stillInQueue: IClientMessage = {
            event: messageEvent.queue,
            payload: String(this.queue.indexOf(queued)),
          }
          queued.wsClient.send(JSON.stringify(stillInQueue));
        })
        item.aiClient.off(wsEvents.message, process);
        console.log('end, start next working', this.working.length, 'waiting', this.queue.length);
      }
    };
    const process = (data: string) => {
      const parsed: IAiMessage = JSON.parse(data);
      if (parsed.event === streamEvents.end) {
        getNextAndRun();
      }
    };
    item.aiClient.on(wsEvents.message, process);
    item.aiClient.on(wsEvents.close, () => item.aiClient.off(wsEvents.message, process));
    item.wsClient.on(wsEvents.error, (error: Error) => {
      console.log('balancer wsError', error.message);
      getNextAndRun();
    })
  }
}