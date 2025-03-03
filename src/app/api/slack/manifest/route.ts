export async function GET() {
  const manifest = {
    display_information: {
      name: "TL;DR",
      description: "Get quick TL;DR and detailed summaries of your Slack threads",
      background_color: "#2c2d30"
    },
    features: {
      app_home: {
        home_tab_enabled: true,
        messages_tab_enabled: true,
        messages_tab_read_only_enabled: false
      },
      bot_user: {
        display_name: "TL;DR",
        always_online: true
      },
      shortcuts: [
        {
          name: "Get TL;DR",
          type: "message",
          callback_id: "get_tldr",
          description: "Get a TL;DR of this thread"
        }
      ]
    },
    oauth_config: {
      scopes: {
        bot: [
          "channels:history",
          "groups:history",
          "im:history",
          "mpim:history",
          "chat:write",
          "commands",
          "app_mentions:read"
        ]
      }
    },
    settings: {
      interactivity: {
        is_enabled: true,
        request_url: `${process.env.APP_URL}/api/slack/actions`
      },
      org_deploy_enabled: false,
      socket_mode_enabled: false,
      token_rotation_enabled: false
    }
  };

  return Response.json(manifest);
} 