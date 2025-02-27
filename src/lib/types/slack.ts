export interface SlackMessage {
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
}

export interface SlackThread {
  messages: SlackMessage[];
  channelId: string;
  threadTs: string;
} 