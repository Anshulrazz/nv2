'use client';

import { useState, useEffect } from 'react';
import { PusherClient } from '@/lib/pusher-client';

interface Announcement {
    _id: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
}

interface AnnouncementsFeedProps {
    eventId: string;
    initialAnnouncements: Announcement[];
}

export function AnnouncementsFeed({ eventId, initialAnnouncements }: AnnouncementsFeedProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

    useEffect(() => {
        // Subscribe to the event-specific channel
        const channel = PusherClient.subscribe(`presence-event-${eventId}`);

        // Listen for new announcements
        channel.bind('new-announcement', (newAnnouncement: Announcement) => {
            setAnnouncements((prev) => {
                // Add new announcement to the top, preventing duplicates
                if (prev.some(a => a._id === newAnnouncement._id)) {
                    return prev;
                }
                const updated = [newAnnouncement, ...prev];
                // Sort by pinned status first, then by date
                updated.sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                return updated;
            });
        });

        // Cleanup on unmount
        return () => {
            channel.unbind_all();
            PusherClient.unsubscribe(`presence-event-${eventId}`);
        };
    }, [eventId]);

    return (
        <div className="p-4 bg-gray-50 rounded-lg h-full overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Announcements</h2>
            <div className="space-y-4">
                {announcements.length > 0 ? (
                    announcements.map((announcement) => (
                        <div key={announcement._id} className={`p-3 rounded-md ${announcement.isPinned ? 'bg-yellow-100 border border-yellow-300' : 'bg-white'}`}>
                            {announcement.isPinned && (
                                <span className="text-xs font-bold text-yellow-800">[PINNED]</span>
                            )}
                            {/* Render HTML content from the editor safely */}
                            <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: announcement.content }}
                            />
                            <p className="text-xs text-gray-500 mt-2 text-right">
                                {new Date(announcement.createdAt).toLocaleTimeString()}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500">No announcements yet.</p>
                )}
            </div>
        </div>
    );
}