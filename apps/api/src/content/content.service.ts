import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { LocationSubmissionStatus, ListingCategory, StoryStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import type {
  CashbackTierDto, CreateArticleDto, CreateExchangeRateDto, CreateListingDto,
  CreateLocationSubmissionDto, CreatePartnerDto, CreateStoryDto, ListingsQueryDto, ReviewLocationDto,
} from "./content.dto";

const EARTH_KM = 6371;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const now = new Date();
    const [stories, articles, exchangeRates, rentals, saleListings, housing] = await Promise.all([
      this.prisma.story.findMany({ where: { status: StoryStatus.PUBLISHED, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }], take: 12 }),
      this.prisma.article.findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 5 }),
      this.prisma.exchangeRate.findMany({ where: { active: true, partner: { active: true } }, include: { partner: true }, orderBy: { checkedAt: "desc" }, take: 6 }),
      this.prisma.listing.findMany({ where: { category: ListingCategory.BIKE_RENTAL, published: true }, orderBy: [{ promotedUntil: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], take: 4 }),
      this.prisma.listing.findMany({ where: { category: ListingCategory.BIKE_SALE, published: true }, orderBy: [{ promotedUntil: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], take: 4 }),
      this.prisma.listing.findMany({ where: { category: ListingCategory.HOUSING_RENTAL, published: true }, orderBy: [{ promotedUntil: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], take: 3 }),
    ]);
    return { stories, articles, exchangeRates, rentals, saleListings, housing };
  }

  async getArticle(slug: string) {
    const article = await this.prisma.article.findFirst({ where: { slug, published: true } });
    if (!article) throw new NotFoundException("Article not found");
    return article;
  }

  async publicStories() {
    const now = new Date();
    return this.prisma.story.findMany({
      where: { status: StoryStatus.PUBLISHED, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    });
  }

  async listListings(query: ListingsQueryDto) {
    const where = {
      category: query.category as ListingCategory,
      published: true,
      ...(query.search ? { OR: [
        { title: { contains: query.search, mode: "insensitive" as const } },
        { description: { contains: query.search, mode: "insensitive" as const } },
        { address: { contains: query.search, mode: "insensitive" as const } },
      ] } : {}),
    };
    const take = Math.min(Math.max(query.limit ?? 12, 1), 40);
    const items = await this.prisma.listing.findMany({
      where,
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: [{ promotedUntil: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    });
    const hasMore = items.length > take;
    const pageItems = hasMore ? items.slice(0, take) : items;
    return { items: pageItems, nextCursor: hasMore ? pageItems.at(-1)?.id ?? null : null };
  }

  async getFleet(lat?: number, lng?: number) {
    const scooters = await this.prisma.scooter.findMany({
      where: { status: { in: ["AVAILABLE", "PARKED"] }, latitude: { not: null }, longitude: { not: null } },
      orderBy: { updatedAt: "desc" },
    });
    return scooters.map((scooter) => {
      const km = lat !== undefined && lng !== undefined && scooter.latitude !== null && scooter.longitude !== null
        ? distanceKm(lat, lng, scooter.latitude, scooter.longitude)
        : null;
      return { ...scooter, distanceKm: km === null ? null : Math.round(km * 10) / 10, walkingMinutes: km === null ? null : Math.ceil(km * 1000 / 80), drivingMinutes: km === null ? null : Math.ceil(km * 60 / 25) };
    });
  }

  async cashbackTiers() {
    return this.prisma.cashbackTier.findMany({ where: { active: true }, orderBy: { minimumCompletedTrips: "asc" } });
  }

  async submitLocation(dto: CreateLocationSubmissionDto) {
    return this.prisma.locationSubmission.create({
      data: { ...dto, status: LocationSubmissionStatus.PENDING },
    });
  }

  async adminStories() {
    return this.prisma.story.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });
  }

  async createStory(dto: CreateStoryDto) {
    if (dto.linkUrl && !dto.linkUrl.startsWith("/") && !/^https?:\/\//i.test(dto.linkUrl)) {
      throw new BadRequestException("Link must be an app path or an http(s) URL");
    }
    const status = dto.status ?? StoryStatus.DRAFT;
    return this.prisma.story.create({
      data: {
        ...dto,
        status,
        publishedAt: status === StoryStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  async changeStoryStatus(id: string, status: StoryStatus) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException("Story not found");
    return this.prisma.story.update({
      where: { id },
      data: { status, publishedAt: status === StoryStatus.PUBLISHED ? (story.publishedAt ?? new Date()) : null },
    });
  }

  async adminArticles() {
    return this.prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
  }

  async createArticle(dto: CreateArticleDto) {
    return this.prisma.article.create({
      data: { ...dto, publishedAt: dto.published ? new Date() : null },
    });
  }

  async adminListings(category?: string) {
    return this.prisma.listing.findMany({
      where: category ? { category: category as ListingCategory } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  async createListing(dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: { ...dto, category: dto.category as ListingCategory },
    });
  }

  async publishListing(id: string, published: boolean) {
    const found = await this.prisma.listing.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("Listing not found");
    return this.prisma.listing.update({ where: { id }, data: { published } });
  }

  async pendingLocations() {
    return this.prisma.locationSubmission.findMany({
      where: { status: LocationSubmissionStatus.PENDING },
      orderBy: { createdAt: "asc" },
    });
  }

  async reviewLocation(id: string, dto: ReviewLocationDto) {
    const found = await this.prisma.locationSubmission.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("Location submission not found");
    return this.prisma.locationSubmission.update({
      where: { id },
      data: { status: dto.status, reviewNote: dto.reviewNote, reviewedAt: new Date() },
    });
  }

  async createPartner(dto: CreatePartnerDto) {
    return this.prisma.partner.create({ data: dto });
  }

  async createExchangeRate(dto: CreateExchangeRateDto) {
    const partner = await this.prisma.partner.findUnique({ where: { slug: dto.partnerSlug } });
    if (!partner) throw new NotFoundException("Partner not found");
    return this.prisma.exchangeRate.create({
      data: {
        partnerId: partner.id,
        baseCode: dto.baseCode.toUpperCase(),
        quoteCode: dto.quoteCode.toUpperCase(),
        rate: dto.rate,
        sourceLabel: dto.sourceLabel,
      },
    });
  }

  async upsertCashbackTier(dto: CashbackTierDto) {
    return this.prisma.cashbackTier.upsert({
      where: { minimumCompletedTrips: dto.minimumCompletedTrips },
      create: dto,
      update: { cashbackPercent: dto.cashbackPercent, active: true },
    });
  }
}
