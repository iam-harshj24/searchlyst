import { prisma } from '../lib/prisma.js';

function serializeProject(data) {
    const result = { ...data };
    // Only set competitors if it was explicitly included in the payload.
    // If competitors is absent from data, we delete it so Prisma skips it
    // entirely and leaves the DB value untouched.
    if ('competitors' in data) {
        result.competitors = data.competitors != null
            ? (typeof data.competitors === 'string' ? data.competitors : JSON.stringify(data.competitors))
            : null;
    } else {
        delete result.competitors;
    }
    if ('trackingLocations' in data) {
        if (data.trackingLocations == null) {
            result.trackingLocations = null;
        } else if (Array.isArray(data.trackingLocations)) {
            const trimmed = data.trackingLocations
                .map((x) => String(x ?? '').trim())
                .filter(Boolean)
                .slice(0, 3);
            result.trackingLocations = trimmed.length ? JSON.stringify(trimmed) : null;
        } else if (typeof data.trackingLocations === 'string') {
            result.trackingLocations = data.trackingLocations.trim() || null;
        } else {
            delete result.trackingLocations;
        }
    } else {
        delete result.trackingLocations;
    }
    return result;
}

function parseTrackingLocations(raw) {
    if (raw == null || raw === '') return [];
    if (Array.isArray(raw)) {
        return raw.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 3);
    }
    if (typeof raw === 'string') {
        try {
            const j = JSON.parse(raw);
            return Array.isArray(j)
                ? j.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 3)
                : [];
        } catch {
            return [];
        }
    }
    return [];
}

function parseSocialIngestSnapshot(raw) {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'object') return raw;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    return null;
}

function deserializeProject(project) {
    if (!project) return project;
    return {
        ...project,
        competitors: project.competitors
            ? (typeof project.competitors === 'string' ? JSON.parse(project.competitors) : project.competitors)
            : null,
        trackingLocations: parseTrackingLocations(project.trackingLocations),
        socialIngestSnapshot: parseSocialIngestSnapshot(project.socialIngestSnapshot),
    };
}

export const projectRepository = {
    async create(data) {
        const result = await prisma.project.create({
            data: {
                userId: data.userId,
                brandName: data.brandName,
                domain: data.domain,
                industry: data.industry,
                companySize: data.companySize,
                location: data.location,
                language: data.language,
                reach: data.reach,
                competitors: data.competitors != null
                    ? (typeof data.competitors === 'string' ? data.competitors : JSON.stringify(data.competitors))
                    : null,
                trackingLocations:
                    data.trackingLocations != null && Array.isArray(data.trackingLocations)
                        ? JSON.stringify(
                              data.trackingLocations
                                  .map((x) => String(x ?? '').trim())
                                  .filter(Boolean)
                                  .slice(0, 3),
                          )
                        : typeof data.trackingLocations === 'string'
                          ? data.trackingLocations || null
                          : null,
            },
        });
        return deserializeProject(result);
    },

    async findByUserId(userId) {
        const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { created_at: 'desc' },
        });
        return projects.map(deserializeProject);
    },

    async findById(id) {
        const project = await prisma.project.findUnique({
            where: { id: parseInt(id) },
        });
        return deserializeProject(project);
    },

    async update(id, data) {
        const serialized = serializeProject(data);
        const result = await prisma.project.update({
            where: { id: parseInt(id) },
            data: serialized,
        });
        return deserializeProject(result);
    },

    async delete(id) {
        return prisma.project.delete({
            where: { id: parseInt(id) },
        });
    },
};
