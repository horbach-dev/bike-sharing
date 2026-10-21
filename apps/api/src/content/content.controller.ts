import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ContentService } from "./content.service";
import { FleetQueryDto, ListingsQueryDto, CreateLocationSubmissionDto } from "./content.dto";

@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("home")
  getHome() {
    return this.content.getHome();
  }

  @Get("articles/:slug")
  getArticle(@Param("slug") slug: string) {
    return this.content.getArticle(slug);
  }

  @Get("stories")
  getStories() {
    return this.content.publicStories();
  }

  @Get("listings")
  getListings(@Query() query: ListingsQueryDto) {
    return this.content.listListings(query);
  }

  @Get("fleet")
  getFleet(@Query() query: FleetQueryDto) {
    return this.content.getFleet(query.lat, query.lng);
  }

  @Get("cashback/tiers")
  getCashbackTiers() {
    return this.content.cashbackTiers();
  }

  @Post("locations")
  submitLocation(@Body() dto: CreateLocationSubmissionDto) {
    return this.content.submitLocation(dto);
  }
}
