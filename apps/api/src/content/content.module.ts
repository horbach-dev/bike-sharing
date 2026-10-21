import { Module } from "@nestjs/common";
import { AdminContentController } from "./admin-content.controller";
import { AdminTokenGuard } from "./admin-token.guard";
import { ContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { AdminMediaController, MediaController } from "./media.controller";

@Module({
  controllers: [ContentController, AdminContentController, MediaController, AdminMediaController],
  providers: [ContentService, AdminTokenGuard],
})
export class ContentModule {}
