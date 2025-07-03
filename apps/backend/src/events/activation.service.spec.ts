import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivationService } from './activation.service';
import { NotificationService } from '../notifications/notification.service';
import { PostActivationHooksService } from './post-activation-hooks.service';
import { Event } from '../database/entities/event.entity';
import { UserActivity } from '../database/entities/user-activity.entity';
import { EventStatus } from '../database/entities/event.entity';
import { ActivityType } from '../database/entities/user-activity.entity';

describe('ActivationService', () => {
  let service: ActivationService;
  let eventRepository: Repository<Event>;
  let userActivityRepository: Repository<UserActivity>;
  let notificationService: NotificationService;
  let postActivationHooksService: PostActivationHooksService;

  // Mock data
  const mockEvent = {
    id: 'event-123',
    name: 'Test Event',
    status: EventStatus.PUBLISHED,
    start_datetime: new Date(Date.now() + 86400000), // tomorrow
    capacity_limit: 100,
    organizer_id: 'organizer-123',
    event_details: {},
    save: jest.fn(),
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivationService,
        {
          provide: getRepositoryToken(Event),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            manager: {
              transaction: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(UserActivity),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendEventActivationNotifications: jest.fn(),
            sendEventDeactivationNotifications: jest.fn(),
          },
        },
        {
          provide: PostActivationHooksService,
          useValue: {
            executePostActivationHooks: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ActivationService>(ActivationService);
    eventRepository = module.get<Repository<Event>>(getRepositoryToken(Event));
    userActivityRepository = module.get<Repository<UserActivity>>(getRepositoryToken(UserActivity));
    notificationService = module.get<NotificationService>(NotificationService);
    postActivationHooksService = module.get<PostActivationHooksService>(PostActivationHooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('activateEvent', () => {
    it('should successfully activate a valid event', async () => {
      // Arrange
      const mockTransaction = jest.fn((callback) => callback());
      eventRepository.manager.transaction = mockTransaction;
      eventRepository.findOne = jest.fn().mockResolvedValue(mockEvent);
      eventRepository.save = jest.fn().mockResolvedValue({
        ...mockEvent,
        status: EventStatus.ACTIVE,
        event_details: { registrationToken: expect.any(String) },
      });
      userActivityRepository.save = jest.fn().mockResolvedValue({});
      notificationService.sendEventActivationNotifications = jest.fn().mockResolvedValue(undefined);
      postActivationHooksService.executePostActivationHooks = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.activateEvent('event-123', 'admin-123', 'Test activation');

      // Assert
      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.registrationLink).toBeDefined();
      expect(result.registrationLink).toContain('register');
      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        relations: ['organizer'],
      });
      expect(userActivityRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'admin-123',
          activity_type: ActivityType.EVENT_ACTIVATED,
          is_successful: true,
        })
      );
             expect(notificationService.sendEventActivationNotifications).toHaveBeenCalled();
       expect(postActivationHooksService.executePostActivationHooks).toHaveBeenCalled();
    });

    it('should fail when event is not found', async () => {
      // Arrange
      eventRepository.findOne = jest.fn().mockResolvedValue(null);

      // Act
      const result = await service.activateEvent('nonexistent', 'admin-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });

    it('should fail when event is already active', async () => {
      // Arrange
      const activeEvent = { ...mockEvent, status: EventStatus.ACTIVE };
      eventRepository.findOne = jest.fn().mockResolvedValue(activeEvent);

      // Act
      const result = await service.activateEvent('event-123', 'admin-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Event is already active');
    });

    it('should fail when event is cancelled', async () => {
      // Arrange
      const cancelledEvent = { ...mockEvent, status: EventStatus.CANCELLED };
      eventRepository.findOne = jest.fn().mockResolvedValue(cancelledEvent);

      // Act
      const result = await service.activateEvent('event-123', 'admin-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot activate cancelled or completed event');
    });

    it('should fail when event is in the past', async () => {
      // Arrange
      const pastEvent = {
        ...mockEvent,
        start_datetime: new Date(Date.now() - 86400000), // yesterday
      };
      eventRepository.findOne = jest.fn().mockResolvedValue(pastEvent);

      // Act
      const result = await service.activateEvent('event-123', 'admin-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot activate past events');
    });

    it('should rollback transaction on error', async () => {
      // Arrange
      const mockTransaction = jest.fn((callback) => {
        throw new Error('Database error');
      });
      eventRepository.manager.transaction = mockTransaction;
      eventRepository.findOne = jest.fn().mockResolvedValue(mockEvent);

      // Act
      const result = await service.activateEvent('event-123', 'admin-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('deactivateEvent', () => {
    it('should successfully deactivate an active event', async () => {
      // Arrange
      const activeEvent = { ...mockEvent, status: EventStatus.ACTIVE };
      eventRepository.findOne = jest.fn().mockResolvedValue(activeEvent);
      eventRepository.save = jest.fn().mockResolvedValue({
        ...activeEvent,
        status: EventStatus.PUBLISHED,
      });
      userActivityRepository.save = jest.fn().mockResolvedValue({});
      // notificationService.notifyEventDeactivation = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.deactivateEvent('event-123', 'admin-123', 'Test deactivation');

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe(EventStatus.PUBLISHED);
      expect(userActivityRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'admin-123',
          activity_type: ActivityType.EVENT_DEACTIVATED,
          is_successful: true,
        })
      );
      // expect(notificationService.notifyEventDeactivation).toHaveBeenCalled();
    });

    it('should fail when event is not found', async () => {
      // Arrange
      eventRepository.findOne = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.deactivateEvent('nonexistent', 'admin-123')).rejects.toThrow('Event not found');
    });

    it('should fail when event is not active', async () => {
      // Arrange
      eventRepository.findOne = jest.fn().mockResolvedValue(mockEvent);

      // Act & Assert
      await expect(service.deactivateEvent('event-123', 'admin-123')).rejects.toThrow('Event is not currently active');
    });
  });

  describe('getActivationStatus', () => {
    it('should return activation status for active event', async () => {
      // Arrange
      const activeEvent = {
        ...mockEvent,
        status: EventStatus.ACTIVE,
        event_details: {
          registrationToken: 'token-123',
          activatedAt: new Date().toISOString(),
        },
      };
      eventRepository.findOne = jest.fn().mockResolvedValue(activeEvent);

      // Act
      const result = await service.getActivationStatus('event-123');

      // Assert
      expect(result.isActive).toBe(true);
      expect(result.registrationLink).toBeDefined();
      expect(result.activationDate).toBeDefined();
    });

    it('should return inactive status for non-active event', async () => {
      // Arrange
      eventRepository.findOne = jest.fn().mockResolvedValue(mockEvent);

      // Act
      const result = await service.getActivationStatus('event-123');

      // Assert
      expect(result.isActive).toBe(false);
      expect(result.registrationLink).toBeUndefined();
      expect(result.activationDate).toBeUndefined();
    });

    it('should throw error when event is not found', async () => {
      // Arrange
      eventRepository.findOne = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.getActivationStatus('nonexistent')).rejects.toThrow('Event not found');
    });
  });

  // TODO: Implement validateEventForActivation method and uncomment these tests
  // describe('validateEventForActivation', () => {
  //   it('should return validation errors for invalid event', () => {
  //     // Arrange
  //     const invalidEvent = {
  //       ...mockEvent,
  //       status: EventStatus.CANCELLED,
  //       start_datetime: new Date(Date.now() - 86400000), // past date
  //     };

  //     // Act
  //     const errors = service.validateEventForActivation(invalidEvent);

  //     // Assert
  //     expect(errors).toHaveLength(2);
  //     expect(errors).toContain('Cannot activate cancelled or completed event');
  //     expect(errors).toContain('Cannot activate past events');
  //   });

  //   it('should return no errors for valid event', () => {
  //     // Act
  //     const errors = service.validateEventForActivation(mockEvent);

  //     // Assert
  //     expect(errors).toHaveLength(0);
  //   });
  // });
}); 