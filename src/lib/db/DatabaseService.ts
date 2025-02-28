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

  async trackSummaryUsage({
    workspaceId,
    channelId,
    threadTs,
    requestedBy,
    messageCount,
    participants,
    topicType
  }: {
    workspaceId: string;
    channelId: string;
    threadTs: string;
    requestedBy: string;
    messageCount: number;
    participants: string[];
    topicType?: string;
  }) {
    // Store summary metadata
    const summary = await prisma.summary.create({
      data: {
        workspaceId,
        channelId,
        threadTs,
        requestedBy,
        messageCount,
        participants,
        topicType,
        content: '', // Store the actual summary content
      }
    });

    // Track analytics
    await prisma.analytics.create({
      data: {
        workspaceId,
        eventType: 'summary_requested',
        userId: requestedBy,
        channelId,
        metadata: {
          threadTs,
          messageCount,
          participantCount: participants.length,
          topicType
        }
      }
    });

    return summary;
  }

  async storeFeedback({
    summaryId,
    userId,
    reaction
  }: {
    summaryId: string;
    userId: string;
    reaction: string;
  }) {
    return prisma.feedback.create({
      data: {
        summaryId,
        userId,
        reaction
      }
    });
  }
} 