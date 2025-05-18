import { Injectable } from '@nestjs/common';

@Injectable()
export class MockPrismaService {
  user = {
    findUnique: jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
      name: 'Test User',
      roles: ['USER'],
    }),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        roles: ['USER'],
      },
      {
        id: 2,
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['ADMIN'],
      },
    ]),
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 999,
      ...data.data,
    })),
    update: jest.fn().mockImplementation((data) => Promise.resolve({
      id: data.where.id,
      ...data.data,
    })),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
  };

  event = {
    findUnique: jest.fn().mockResolvedValue({
      id: 1,
      title: 'Test Event',
      description: 'Test Description',
      date: new Date(),
      organizerId: 1,
    }),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Test Event 1',
        description: 'Test Description 1',
        date: new Date(),
        organizerId: 1,
      },
      {
        id: 2,
        title: 'Test Event 2',
        description: 'Test Description 2',
        date: new Date(),
        organizerId: 2,
      },
    ]),
    create: jest.fn().mockImplementation((data) => Promise.resolve({
      id: 999,
      ...data.data,
    })),
    update: jest.fn().mockImplementation((data) => Promise.resolve({
      id: data.where.id,
      ...data.data,
    })),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
  };

  // Add other models as needed

  // Mock transaction method
  $transaction = jest.fn().mockImplementation((callbacks) => {
    return Array.isArray(callbacks)
      ? Promise.all(callbacks)
      : callbacks(this);
  });
} 