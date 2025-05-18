import { PermissionsGuard } from '../../src/common/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PERMISSIONS_KEY, Permission } from '../../src/common/decorators/permissions.decorator';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Role } from '../../src/common/decorators/roles.decorator';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let prismaService: PrismaService;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    prismaService = {} as PrismaService;
    guard = new PermissionsGuard(reflector, prismaService);

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no permissions are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    
    expect(await guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw UnauthorizedException if user is not authenticated', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.READ_EVENT]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: null,
    });
    
    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if user has no role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.READ_EVENT]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: {},
    });
    
    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
  });

  it('should deny access if user does not have the required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_USERS]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { role: Role.STAFF },
    });
    
    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access if user has the required permission based on role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.CHECK_IN_ATTENDEE]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { role: Role.STAFF },
    });
    
    expect(await guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access to admin role regardless of permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.MANAGE_USERS]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { role: Role.ADMIN },
    });
    
    expect(await guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access if user is missing one of multiple required permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Permission.VIEW_REPORTS, 
      Permission.EXPORT_REPORTS
    ]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { role: Role.STAFF }, // STAFF has VIEW_REPORTS but not EXPORT_REPORTS
    });
    
    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
  });
}); 