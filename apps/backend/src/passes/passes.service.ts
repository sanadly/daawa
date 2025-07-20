import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pass } from '../database/entities/pass.entity';
import { Guest } from '../database/entities/guest.entity';
import { randomBytes } from 'crypto';
import { PassResponseDto } from './dto';

@Injectable()
export class PassesService {
  private readonly logger = new Logger(PassesService.name);

  constructor(
    @InjectRepository(Pass)
    private readonly passRepository: Repository<Pass>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  async createPassForGuest(guestId: string): Promise<Pass> {
    this.logger.log(`Creating pass for guest ${guestId}`);

    const guest = await this.guestRepository.findOne({ where: { id: guestId } });
    if (!guest) {
      throw new NotFoundException(`Guest with ID ${guestId} not found`);
    }

    const existingPass = await this.passRepository.findOne({ where: { guest_id: guestId } });
    if (existingPass) {
      this.logger.warn(`Pass already exists for guest ${guestId}. Returning existing pass.`);
      return existingPass;
    }

    const accessToken = await this.generateUniqueAccessToken();

    const newPass = this.passRepository.create({
      guest_id: guestId,
      access_token: accessToken,
    });

    return this.passRepository.save(newPass);
  }

  async findPassByToken(token: string): Promise<PassResponseDto> {
    this.logger.log(`Finding pass with token ${token}`);

    const pass = await this.passRepository.findOne({
      where: { access_token: token },
      relations: ['guest', 'guest.event', 'guest.tier'],
    });

    if (!pass) {
      throw new NotFoundException('Pass not found or invalid');
    }

    // Update last accessed time
    pass.last_accessed_at = new Date();
    await this.passRepository.save(pass);

    return PassResponseDto.fromEntity(pass);
  }

  private async generateUniqueAccessToken(): Promise<string> {
    let token: string;
    let isUnique = false;
    while (!isUnique) {
      token = randomBytes(32).toString('hex');
      const existingPass = await this.passRepository.findOne({ where: { access_token: token } });
      if (!existingPass) {
        isUnique = true;
      }
    }
    return token;
  }
}
