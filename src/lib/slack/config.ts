export const SLACK_CONFIG = {
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  scopes: [
    'channels:history',
    'groups:history',
    'chat:write',
    'commands',
    'team:read'
  ]
}; 