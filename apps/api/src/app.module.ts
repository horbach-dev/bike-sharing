import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./database/prisma.module";
import { ContentModule } from "./content/content.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, ContentModule],
  controllers: [HealthController],
})
export class AppModule {}
