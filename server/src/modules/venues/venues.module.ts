import { Module, Controller, Get, Post, Put, Body, Param, Query, UseGuards, NotFoundException, BadRequestException, Injectable } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue, Court, VenuePhoto, OperatingHour, PricingRule, Review, Owner } from '../../database/entities';
import { VenueStatus, UserRole } from '../../common/enums';
import { CurrentUser, Roles, RolesGuard } from '../../common';

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue) private venueRepo: Repository<Venue>,
    @InjectRepository(Court) private courtRepo: Repository<Court>,
    @InjectRepository(VenuePhoto) private photoRepo: Repository<VenuePhoto>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Owner) private ownerRepo: Repository<Owner>,
  ) {}

  async findAll(query: { search?: string; sport?: string; area?: string; status?: string }) {
    const qb = this.venueRepo.createQueryBuilder('venue')
      .leftJoinAndSelect('venue.courts', 'court')
      .leftJoinAndSelect('venue.photos', 'photo')
      .leftJoinAndSelect('venue.owner', 'owner');

    if (query.status) {
      qb.andWhere('venue.status = :status', { status: query.status });
    } else {
      qb.andWhere('venue.status IN (:...statuses)', { statuses: [VenueStatus.APPROVED, VenueStatus.ACTIVE] });
    }

    if (query.sport && query.sport !== 'all') {
      qb.andWhere('LOWER(venue.primarySport) = LOWER(:sport) OR LOWER(venue.sports) LIKE LOWER(:sportPattern)', {
        sport: query.sport,
        sportPattern: `%${query.sport}%`,
      });
    }

    if (query.area && query.area !== 'all') {
      qb.andWhere('LOWER(venue.area) LIKE LOWER(:area)', { area: `%${query.area}%` });
    }

    if (query.search) {
      qb.andWhere('(LOWER(venue.name) LIKE LOWER(:q) OR LOWER(venue.area) LIKE LOWER(:q) OR LOWER(venue.city) LIKE LOWER(:q))', {
        q: `%${query.search}%`,
      });
    }

    const venues = await qb.getMany();
    return {
      success: true,
      total: venues.length,
      venues,
    };
  }

  async findOne(id: string) {
    const venue = await this.venueRepo.findOne({
      where: { id },
      relations: ['courts', 'photos', 'operatingHours', 'pricingRules', 'owner'],
    });
    if (!venue) {
      throw new NotFoundException(`Venue with ID "${id}" was not found.`);
    }

    const reviews = await this.reviewRepo.find({
      where: { venueId: id },
      relations: ['user', 'replies'],
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      venue,
      reviews,
    };
  }

  async createVenue(ownerId: string, data: any) {
    const owner = await this.ownerRepo.findOne({ where: { id: ownerId } });
    if (!owner) throw new BadRequestException('Owner not found.');

    const venue = this.venueRepo.create({
      name: data.name,
      description: data.description,
      primarySport: data.primarySport || 'Football',
      sports: data.sports || [data.primarySport || 'Football'],
      address: data.address,
      area: data.area || 'Pune',
      city: data.city || 'Pune',
      state: data.state || 'Maharashtra',
      pincode: data.pincode || '411038',
      amenities: data.amenities || [],
      ownerId,
      status: VenueStatus.PENDING, // requires admin verification
      courtsCount: data.courts?.length || 1,
    });

    const saved = await this.venueRepo.save(venue);

    if (data.courts && Array.isArray(data.courts)) {
      for (const c of data.courts) {
        const court = this.courtRepo.create({
          name: c.name || 'Court 1',
          surfaceType: c.surfaceType || c.type || 'Synthetic Turf',
          sport: c.sport || saved.primarySport,
          basePricePerHour: c.basePrice || c.basePricePerHour || 800,
          peakPricePerHour: c.peakPrice || c.peakPricePerHour || 1100,
          venueId: saved.id,
        });
        await this.courtRepo.save(court);
      }
    }

    if (data.photos && Array.isArray(data.photos)) {
      for (const p of data.photos) {
        const photo = this.photoRepo.create({
          url: typeof p === 'string' ? p : p.url,
          venueId: saved.id,
        });
        await this.photoRepo.save(photo);
      }
    }

    return {
      success: true,
      message: 'Venue created successfully and submitted for admin review.',
      venue: await this.findOne(saved.id),
    };
  }

  async updateVenue(id: string, ownerId: string, data: any) {
    const venue = await this.venueRepo.findOne({ where: { id } });
    if (!venue) throw new NotFoundException('Venue not found.');
    if (venue.ownerId !== ownerId) throw new BadRequestException('Unauthorized to edit this venue.');

    Object.assign(venue, data);
    const updated = await this.venueRepo.save(venue);
    return {
      success: true,
      message: 'Venue updated successfully.',
      venue: updated,
    };
  }
}

@Controller('venues')
export class VenuesController {
  constructor(private venuesService: VenuesService) {}

  @Get()
  async getVenues(@Query() query: { search?: string; sport?: string; area?: string; status?: string }) {
    return this.venuesService.findAll(query);
  }

  @Get(':id')
  async getVenue(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Post()
  async createVenue(@Body() body: any) {
    return this.venuesService.createVenue(body.ownerId, body);
  }

  @Put(':id')
  async updateVenue(@Param('id') id: string, @Body() body: any) {
    return this.venuesService.updateVenue(id, body.ownerId, body);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Venue, Court, VenuePhoto, OperatingHour, PricingRule, Review, Owner]),
  ],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
