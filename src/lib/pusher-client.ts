'use client';

import Pusher from 'pusher-js';

const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!key || !cluster) {
    throw new Error('Missing Pusher client credentials');
}

// Create a singleton instance of the Pusher client
export const PusherClient = new Pusher(key, {
    cluster,
    // You can add other client options here, like authentication
    // authEndpoint: '/api/pusher/auth',
});

// Log connection state changes for debugging
PusherClient.connection.bind('state_change', (states: { previous: string; current: string }) => {
    console.log(`[Pusher-Client] Connection state changed from ${states.previous} to ${states.current}`);
});