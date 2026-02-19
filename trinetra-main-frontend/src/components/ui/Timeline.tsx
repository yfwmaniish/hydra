import React from 'react';

interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    status: 'completed' | 'current' | 'pending';
}

interface TimelineProps {
    events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
    return (
        <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
            {events.map((event) => (
                <div key={event.id} className="relative">
                    {/* Dot */}
                    <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 ${event.status === 'completed' ? 'bg-green-500 border-green-500' :
                        event.status === 'current' ? 'bg-blue-500 border-blue-500 animate-pulse' :
                            'bg-white border-gray-300'
                        }`}></div>

                    <div className="flex flex-col">
                        <span className="text-xs text-muted mb-1">{event.timestamp}</span>
                        <h4 className={`text-sm font-bold ${event.status === 'pending' ? 'text-muted' : 'text-text'}`}>
                            {event.title}
                        </h4>
                        <p className="text-xs text-muted mt-1">{event.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Timeline;
