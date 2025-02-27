import crypto from 'crypto';

export function verifySlackRequest(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Verify all required parameters are present
  if (!signature || !timestamp || !body) {
    console.log('Missing required parameters for verification');
    return false;
  }

  try {
    // Slack requires the request to be no older than 5 minutes
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
    if (parseInt(timestamp) < fiveMinutesAgo) {
      console.log('Request is too old');
      return false;
    }

    const signatureBaseString = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', process.env.SLACK_SIGNING_SECRET!)
      .update(signatureBaseString)
      .digest('hex');

    // Use a constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying Slack request:', error);
    return false;
  }
}
