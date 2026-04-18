import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        console.log('Testing Prisma connection...');
        await prisma.$connect();
        console.log('✓ Successfully connected to SQLite!');
        const users = await prisma.user.count();
        console.log(`✓ Database is accessible. User count: ${users}`);
        await prisma.$disconnect();
    } catch (e) {
        console.error('✗ Connection failed:', e);
        process.exit(1);
    }
}
main();
