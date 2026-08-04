'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

// Assuming you have a TipTap-based SimpleEditor component
import { SimpleEditor } from '@/components/editor/SimpleEditor';

export default function HostAnnouncementsPage() {
    const params = useParams();
    const eventId = params.id as string;

    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [sendPush, setSendPush] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            setError('Announcement content cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`/api/events/${eventId}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, isPinned, sendPush }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send announcement.');
            }

            setSuccess('Announcement sent successfully!');
            setContent('');
            setIsPinned(false);
            setSendPush(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send announcement.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Send Announcement</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Announcement Content
                    </label>
                    {/* Using your existing SimpleEditor for rich text */}
                    <SimpleEditor value={content} onChange={setContent} />
                </div>

                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isPinned}
                            onChange={(e) => setIsPinned(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Pin this announcement</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={sendPush}
                            onChange={(e) => setSendPush(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Send as push notification</span>
                    </label>
                </div>

                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    {isSubmitting ? 'Sending...' : 'Send Announcement'}
                </button>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            </form>
        </div>
    );
}