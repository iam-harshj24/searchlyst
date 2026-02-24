import { prisma } from '../lib/prisma.js';

function serializeProject(data) {
    return {
        ...data,
        competitors: data.competitors != null
            ? (typeof data.competitors === 'string' ? data.competitors : JSON.stringify(data.competitors))
            : null,
    };
}

function deserializeProject(project) {
    if (!project) return project;
    return {
        ...project,
        competitors: project.competitors
            ? (typeof project.competitors === 'string' ? JSON.parse(project.competitors) : project.competitors)
            : null,
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
