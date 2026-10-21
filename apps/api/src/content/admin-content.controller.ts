import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { StoryStatus } from "@prisma/client";
import { AdminTokenGuard } from "./admin-token.guard";
import {
  CashbackTierDto, CreateArticleDto, CreateExchangeRateDto, CreateListingDto,
  CreatePartnerDto, CreateStoryDto, ReviewLocationDto,
} from "./content.dto";
import { ContentService } from "./content.service";

@Controller("admin/content")
@UseGuards(AdminTokenGuard)
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get("stories")
  stories() {
    return this.content.adminStories();
  }

  @Post("stories")
  createStory(@Body() dto: CreateStoryDto) {
    return this.content.createStory(dto);
  }

  @Patch("stories/:id/status")
  setStoryStatus(@Param("id") id: string, @Body("status") status: StoryStatus) {
    return this.content.changeStoryStatus(id, status);
  }

  @Get("articles")
  articles() {
    return this.content.adminArticles();
  }

  @Post("articles")
  createArticle(@Body() dto: CreateArticleDto) {
    return this.content.createArticle(dto);
  }

  @Get("listings")
  listings(@Query("category") category?: string) {
    return this.content.adminListings(category);
  }

  @Post("listings")
  createListing(@Body() dto: CreateListingDto) {
    return this.content.createListing(dto);
  }

  @Patch("listings/:id/published")
  publishListing(@Param("id") id: string, @Body("published") published: boolean) {
    return this.content.publishListing(id, published);
  }

  @Get("locations/pending")
  pendingLocations() {
    return this.content.pendingLocations();
  }

  @Patch("locations/:id/review")
  reviewLocation(@Param("id") id: string, @Body() dto: ReviewLocationDto) {
    return this.content.reviewLocation(id, dto);
  }

  @Post("partners")
  createPartner(@Body() dto: CreatePartnerDto) {
    return this.content.createPartner(dto);
  }

  @Post("exchange-rates")
  createExchangeRate(@Body() dto: CreateExchangeRateDto) {
    return this.content.createExchangeRate(dto);
  }

  @Post("cashback-tiers")
  upsertCashbackTier(@Body() dto: CashbackTierDto) {
    return this.content.upsertCashbackTier(dto);
  }
}
