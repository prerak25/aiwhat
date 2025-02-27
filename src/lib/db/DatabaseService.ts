import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DatabaseService {
  async saveWorkspace(data: {
    slackTeamId: string;
    accessToken: string;
    botToken: string;
  }) {
    return prisma.workspace.upsert({
      where: { slackTeamId: data.slackTeamId },
      update: {
        accessToken: data.accessToken,
        botToken: data.botToken,
      },
      create: {
        slackTeamId: data.slackTeamId,
        accessToken: data.accessToken,
        botToken: data.botToken,
      },
    });
  }

  async saveSummary(data: {
    threadTs: string;
    channelId: string;
    content: string;
    workspaceId: string;
  }) {
    return prisma.summary.upsert({
      where: {
        threadTs_channelId: {
          threadTs: data.threadTs,
          channelId: data.channelId,
        },
      },
      update: {
        content: data.content,
      },
      create: {
        threadTs: data.threadTs,
        channelId: data.channelId,
        content: data.content,
        workspaceId: data.workspaceId,
      },
    });
  }

  async getSummary(threadTs: string, channelId: string) {
    return prisma.summary.findUnique({
      where: {
        threadTs_channelId: {
          threadTs,
          channelId,
        },
      },
    });
  }
} 