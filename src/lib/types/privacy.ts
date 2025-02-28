export const SENSITIVE_DATA = {
  // Don't store these
  DO_NOT_STORE: [
    'message_content',  // Raw message content
    'file_content',     // File contents
    'private_channels', // Private channel details
    'dm_messages',      // Direct messages
    'user_emails',      // User email addresses
    'personal_data'     // Personal identifiable information
  ],

  // Safe to store
  SAFE_TO_STORE: [
    'thread_timestamps',
    'channel_ids',
    'public_channel_names',
    'user_ids',
    'summary_content',
    'workspace_metadata',
    'analytics_data'
  ]
}; 