import { RolesGuard } from '../../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ROLES_KEY, Role } from '../../src/common/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

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

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw UnauthorizedException if user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: null,
    });
    
    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException if user has no role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: {},
    });
    
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user does not have the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { role: Role.USER },
    });
    
    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should allow access if user has the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { role: Role.ADMIN },
    });
    
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access if user has one of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.STAFF, Role.ADMIN]);
    
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: { role: Role.ADMIN },
    });
    
    expect(guard.canActivate(mockContext)).toBe(true);
  });
}); 