/**
 * Threat Service — connects the frontend to the real Trinetra backend API.
 * Falls back to mock data if the backend is unavailable.
 */
import { api } from './api';
import {
    mockThreats,
    mockEntities,
    mockLinks,
    mockSectors,
    mockTimelineData,
    type Threat,
    type Entity,
    type Link,
    type Sector,
    type TimelineData,
} from '../data/mockData';

/**
 * Try calling the API, fall back to mock data if backend is down.
 */
async function withFallback<T>(apiFn: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await apiFn();
    } catch (error) {
        console.warn('[ThreatService] API call failed, using mock data:', error);
        return fallback;
    }
}

export const threatService = {
    getThreats: async (severity?: string): Promise<Threat[]> => {
        return withFallback(
            () => api.threats.list(severity),
            [...mockThreats]
        );
    },

    getThreatById: async (id: string): Promise<Threat | undefined> => {
        return withFallback(
            () => api.threats.get(id),
            mockThreats.find(t => t.id === id)
        );
    },

    searchThreats: async (query: string): Promise<Threat[]> => {
        return withFallback(
            () => api.threats.search(query),
            mockThreats.filter(t =>
                t.title.toLowerCase().includes(query.toLowerCase()) ||
                t.id.toLowerCase().includes(query.toLowerCase())
            )
        );
    },

    getEntities: async (): Promise<Entity[]> => {
        return withFallback(
            () => api.entities.list(),
            [...mockEntities]
        );
    },

    getLinks: async (): Promise<Link[]> => {
        return withFallback(
            () => api.entities.links(),
            [...mockLinks]
        );
    },

    getSectors: async (): Promise<Sector[]> => {
        return withFallback(
            () => api.sectors.list(),
            [...mockSectors]
        );
    },

    getThreatTimeline: async (): Promise<TimelineData[]> => {
        return withFallback(
            () => api.threats.timeline(),
            [...mockTimelineData]
        );
    },
};
