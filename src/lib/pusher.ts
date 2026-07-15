import PusherServer from 'pusher';

const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

// Create a dummy pusher server if environment variables are missing (prevents crashes during dev/build)
export const pusherServer = (appId && key && secret && cluster) 
  ? new PusherServer({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    })
  : {
      trigger: async (channel: string, event: string, data: any) => {
        console.warn(`[Pusher] Missing credentials. Attempted to trigger '${event}' on '${channel}'`);
      }
    } as any;
