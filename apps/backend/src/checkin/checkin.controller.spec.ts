import { Test, TestingModule } from '@nestjs/testing';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './services/checkin.service';
import { QrCodeService } from './services/qr-code.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { UserRole } from '../database/entities/user.entity';
import { CheckinRequestDto, QrValidationRequestDto } from './dtos';
import { HttpStatus } from '@nestjs/common';

describe('CheckinController', () => {
  let controller: CheckinController;
  let checkinService: CheckinService;
  let qrCodeService: QrCodeService;

  const mockCheckinService = {
    recordCheckin: jest.fn(),
    getCheckinHistory: jest.fn(),
    getGuestCheckinStatus: jest.fn(),
  };

  const mockQrCodeService = {
    validateQrCode: jest.fn(),
    generateQrCode: jest.fn(),
  };

  const mockUser = { id: 'user-uuid', role: UserRole.ADMIN, permissions: [] };
  const mockRequest = { user: mockUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckinController],
      providers: [
        { provide: CheckinService, useValue: mockCheckinService },
        { provide: QrCodeService, useValue: mockQrCodeService },
      ],
    })
    .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
    .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
    .compile();

    controller = module.get<CheckinController>(CheckinController);
    checkinService = module.get<CheckinService>(CheckinService);
    qrCodeService = module.get<QrCodeService>(QrCodeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validateQrCode', () => {
    it('should validate a QR code', async () => {
      const dto: QrValidationRequestDto = { qr_code_data: 'test-qr-code' };
      const result = { valid: true, guest: {} as any, event: {} as any };
      mockQrCodeService.validateQrCode.mockResolvedValue(result);

      expect(await controller.validateQrCode(dto)).toEqual(result);
      expect(mockQrCodeService.validateQrCode).toHaveBeenCalledWith(dto);
    });
  });

  describe('recordCheckin', () => {
    it('should record a check-in', async () => {
      const dto: CheckinRequestDto = { guest_id: 'guest-uuid', event_id: 'event-uuid', checkin_method: 'qr_code' as any };
      const result = { success: true, guest: { id: 'guest-uuid' } };
      mockCheckinService.recordCheckin.mockResolvedValue(result);

      expect(await controller.recordCheckin(dto, mockRequest)).toEqual(result);
      expect(mockCheckinService.recordCheckin).toHaveBeenCalledWith(dto, mockUser.id);
    });
  });

  describe('getGuestCheckinStatus', () => {
    it('should retrieve guest check-in status', async () => {
      const guestId = 'guest-uuid';
      const eventId = 'event-uuid';
      const result = { status: 'checked-in' };
      mockCheckinService.getGuestCheckinStatus.mockResolvedValue(result);

      expect(await controller.getGuestCheckinStatus(eventId, guestId)).toEqual(result);
      expect(mockCheckinService.getGuestCheckinStatus).toHaveBeenCalledWith(guestId);
    });
  });

  describe('generateGuestQrCode', () => {
    it('should generate a QR code for a guest', async () => {
        const guestId = 'guest-uuid';
        const eventId = 'event-uuid';
        const result = 'qr-code-string';
        mockQrCodeService.generateQrCode.mockResolvedValue(result);

        expect(await controller.generateGuestQrCode(eventId, guestId)).toEqual(result);
        expect(mockQrCodeService.generateQrCode).toHaveBeenCalledWith(guestId, eventId);
    });
  });
}); 