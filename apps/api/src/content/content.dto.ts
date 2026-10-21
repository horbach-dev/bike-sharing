import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, Min, MinLength } from "class-validator";

export class ListingsQueryDto {
  @IsIn(["BIKE_RENTAL", "BIKE_SALE", "HOUSING_RENTAL"])
  category!: "BIKE_RENTAL" | "BIKE_SALE" | "HOUSING_RENTAL";

  @IsOptional() @IsString()
  cursor?: string;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(40)
  limit = 12;
}

export class FleetQueryDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90)
  lat?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180)
  lng?: number;
}

export class CreateStoryDto {
  @IsString() @MinLength(2)
  title!: string;

  @IsUrl({ require_protocol: true })
  posterUrl!: string;

  @IsString() @MinLength(1)
  text!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  linkUrl?: string;

  @IsOptional() @IsString()
  linkLabel?: string;

  @IsOptional() @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";

  @IsOptional() @Type(() => Number) @IsInt()
  sortOrder?: number;
}

export class CreateArticleDto {
  @IsString() @MinLength(2)
  slug!: string;

  @IsString() @MinLength(2)
  title!: string;

  @IsString() @MinLength(2)
  excerpt!: string;

  @IsString() @MinLength(2)
  body!: string;

  @IsUrl({ require_protocol: true })
  coverUrl!: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsBoolean()
  featured?: boolean;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

export class CreateListingDto {
  @IsIn(["BIKE_RENTAL", "BIKE_SALE", "HOUSING_RENTAL"])
  category!: "BIKE_RENTAL" | "BIKE_SALE" | "HOUSING_RENTAL";

  @IsString() @MinLength(3)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  price?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90)
  latitude?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180)
  longitude?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  areaSqm?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bedrooms?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  bathrooms?: number;

  @IsOptional() @IsBoolean()
  hasTv?: boolean;

  @IsOptional() @IsBoolean()
  hasFridge?: boolean;

  @IsOptional() @IsBoolean()
  hasTables?: boolean;

  @IsOptional() @IsString({ each: true })
  amenities?: string[];

  @IsOptional() @IsUrl({ require_protocol: true }, { each: true })
  imageUrls?: string[];

  @IsOptional() @IsString()
  contact?: string;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

export class CreateLocationSubmissionDto {
  @IsString() @MinLength(3)
  title!: string;

  @IsString() @MinLength(10)
  description!: string;

  @Type(() => Number) @IsNumber() @Min(-90) @Max(90)
  latitude!: number;

  @Type(() => Number) @IsNumber() @Min(-180) @Max(180)
  longitude!: number;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsUrl({ require_protocol: true })
  imageUrl?: string;

  @IsOptional() @IsString()
  telegramId?: string;
}

export class ReviewLocationDto {
  @IsIn(["APPROVED", "REJECTED"])
  status!: "APPROVED" | "REJECTED";

  @IsOptional() @IsString()
  reviewNote?: string;
}

export class CreateExchangeRateDto {
  @IsString()
  partnerSlug!: string;

  @IsString()
  baseCode!: string;

  @IsString()
  quoteCode!: string;

  @Type(() => Number) @IsNumber() @Min(0)
  rate!: number;

  @IsOptional() @IsString()
  sourceLabel?: string;
}

export class CreatePartnerDto {
  @IsString() @MinLength(2)
  name!: string;

  @IsString() @MinLength(2)
  slug!: string;

  @IsOptional() @IsUrl({ require_protocol: true })
  websiteUrl?: string;

  @IsOptional() @IsUrl({ require_protocol: true })
  affiliateUrl?: string;

  @IsOptional() @IsString()
  commissionNote?: string;
}

export class CashbackTierDto {
  @Type(() => Number) @IsInt() @Min(0)
  minimumCompletedTrips!: number;

  @Type(() => Number) @IsNumber() @Min(0) @Max(100)
  cashbackPercent!: number;
}
