import { PrismaClient } from '@prisma/client';
import assert from 'assert';
import { ObjectId } from 'bson';
const prisma = new PrismaClient();

const main = async () => {
  const user = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@bob.com',
    },
  });

  const company = await prisma.company.create({
    data: {
      name: 'Bob',
      users: {
        create: {
          role: 'ADMIN',
          userId: user.id,
        },
      },
    },
  }); //

  const createMeetingPayloads = Array(2)
    .fill(null)
    .map(async (_, i) => {
      return await prisma.meeting.create({
        data: {
          title: `Meeting ${i}`,
          id: new ObjectId().toString(),
          companyId: company.id,
          localParticipants: {
            create: {
              userId: user.id,
              role: 'ADMIN',
            },
          },
        },
      });
    });

  const meetings = await Promise.all(createMeetingPayloads);

  let foundCount = 0;

  for (const meeting of meetings) {
    const foundMeeting = await prisma.meeting.findUnique({
      where: {
        id: meeting.id,
        companyId: company.id,
        localParticipants: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (foundMeeting) {
      foundCount++;
    }
  }

  console.log({
    foundCount,
    createdCount: meetings.length,
  });

  assert.equal(
    foundCount,
    meetings.length,
    new Error('Not all meetings were found')
  );
};

main();
