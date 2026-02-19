export interface Threat {
    id: string;
    source: string;
    target: string;
    type: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    credibility: number; // 0-100
    timestamp: string;
    status: 'New' | 'Investigating' | 'Escalated' | 'Resolved';
    rawEvidence: string;
    location?: { lat: number; lng: number; name: string };
    details?: string;
    title: string;
}

export interface Entity {
    id: number;
    label: string;
    type: 'actor' | 'ip' | 'domain' | 'target' | 'credential';
    x: number;
    y: number;
    size: number;
    status?: string;
}

export interface Link {
    source: number;
    target: number;
}

export const mockThreats: Threat[] = [
    {
        id: 'THR-2024-001',
        title: 'Advanced Persistent Threat - Lazarus Group',
        source: 'Pyongyang, KP',
        target: 'Financial Sector',
        type: 'Malware',
        severity: 'Critical',
        credibility: 95,
        timestamp: '2024-03-10T08:30:00Z',
        status: 'Investigating',
        rawEvidence: '4d 5a 90 00 03 00 00 00 04 00 00 00 ff ff 00 00\nb8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00\n00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00\n00 00 00 00 00 00 00 00 00 00 00 00 80 00 00 00\n0e 1f ba 0e 00 b4 09 cd 21 b8 01 4c cd 21 54 68\n69 73 20 70 72 6f 67 72 61 6d 20 63 61 6e 6e 6f\n74 20 62 65 20 72 75 6e 20 69 6e 20 44 4f 53 20\n6d 6f 64 65 2e 0d 0d 0a 24 00 00 00 00 00 00 00'
    },
    {
        id: 'THR-2024-002',
        title: 'DDoS Attack - Power Grid',
        source: 'Unknown Proxy',
        target: 'Energy Sector',
        type: 'DDoS',
        severity: 'High',
        credibility: 88,
        timestamp: '2024-03-10T09:15:00Z',
        status: 'New',
        rawEvidence: 'GET /api/v1/status HTTP/1.1\nHost: grid-control.internal\nUser-Agent: botnet-x\nAccept: */*\n\nPOST /api/v1/overload HTTP/1.1\nContent-Length: 9999999'
    },
    {
        id: 'THR-2024-003',
        title: 'Phishing Campaign - Executive Target',
        source: 'Email Relay',
        target: 'Government',
        type: 'Phishing',
        severity: 'Medium',
        credibility: 75,
        timestamp: '2024-03-09T14:45:00Z',
        status: 'Resolved',
        rawEvidence: 'Subject: Urgent: Account Verification Required\nFrom: support@microsoff.com\nTo: admin@gov.in\n\nPlease click here to verify your credentials immediately.'
    },
    {
        id: 'THR-2024-004',
        title: 'Exposed Production API Keys',
        source: 'GitHub Public Repo',
        target: 'Tech Infrastructure',
        type: 'Leak',
        severity: 'Critical',
        credibility: 99,
        timestamp: '2024-03-10T10:05:00Z',
        status: 'Escalated',
        rawEvidence: 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    },
    {
        id: 'THR-2024-005',
        title: 'Suspicious Port Scanning',
        source: '192.168.1.105',
        target: 'Internal Network',
        type: 'Reconnaissance',
        severity: 'Low',
        credibility: 45,
        timestamp: '2024-03-10T11:20:00Z',
        status: 'New',
        rawEvidence: 'nmap -sS -p- 192.168.1.0/24\nStarting Nmap 7.92 at 2024-03-10 11:20 UTC\nNmap scan report for 192.168.1.1\nHost is up (0.0010s latency).'
    }
];

export const mockEntities: Entity[] = [
    { id: 1, x: 400, y: 300, label: 'Lazarus Group', type: 'actor', size: 60 },
    { id: 2, x: 250, y: 150, label: '192.168.1.105', type: 'ip', size: 40 },
    { id: 3, x: 550, y: 150, label: 'malware.bin', type: 'domain', size: 40 },
    { id: 4, x: 250, y: 450, label: 'Finance Dept', type: 'target', size: 50 },
    { id: 5, x: 550, y: 450, label: 'Power Grid', type: 'target', size: 50 },
    { id: 6, x: 100, y: 300, label: 'Proxy Node', type: 'ip', size: 30 },
    { id: 7, x: 700, y: 300, label: 'C2 Server', type: 'domain', size: 40 },
];

export const mockLinks: Link[] = [
    { source: 1, target: 2 },
    { source: 1, target: 3 },
    { source: 1, target: 4 },
    { source: 1, target: 5 },
    { source: 2, target: 6 },
    { source: 3, target: 7 },
];

export interface Sector {
    id: string;
    name: string;
    icon: string; // Storing icon name for mapping in component
    health: number; // 0-100
    status: 'Stable' | 'Warning' | 'Critical';
}

export interface TimelineData {
    time: string;
    value: number;
}

export const mockSectors: Sector[] = [
    { id: '1', name: 'Power Grid', icon: 'zap', health: 45, status: 'Critical' },
    { id: '2', name: 'Finance / UPI', icon: 'landmark', health: 88, status: 'Stable' },
    { id: '3', name: 'Telecom', icon: 'wifi', health: 72, status: 'Warning' },
    { id: '4', name: 'Gov Data', icon: 'database', health: 95, status: 'Stable' },
    { id: '5', name: 'Healthcare', icon: 'activity', health: 91, status: 'Stable' },
];

export const mockTimelineData: TimelineData[] = [
    { time: '00:00', value: 12 },
    { time: '04:00', value: 8 },
    { time: '08:00', value: 24 },
    { time: '12:00', value: 18 },
    { time: '16:00', value: 32 },
    { time: '20:00', value: 28 },
    { time: '24:00', value: 15 },
];
