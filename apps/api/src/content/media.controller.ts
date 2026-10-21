import { BadRequestException, Controller, Get, NotFoundException, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import type { Response } from "express";
import { existsSync, mkdirSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import { AdminTokenGuard } from "./admin-token.guard";

const mediaRoot = () => resolve(process.env.UPLOAD_DIR ?? "uploads");
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif");

@Controller("media")
export class MediaController {
  @Get(":filename")
  serve(@Param("filename") filename: string, @Res() response: Response) {
    const safeName = basename(filename);
    const filePath = resolve(mediaRoot(), safeName);
    if (safeName !== filename || !existsSync(filePath)) throw new NotFoundException("Media not found");
    return response.sendFile(filePath);
  }
}

@Controller("admin/content")
export class AdminMediaController {
  constructor(private readonly config: ConfigService) {}

  @Post("upload")
  @UseGuards(AdminTokenGuard)
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        const directory = mediaRoot();
        mkdirSync(directory, { recursive: true });
        callback(null, directory);
      },
      filename: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        if (!allowedExtensions.has(extension)) return callback(new BadRequestException("Only JPG, PNG, WebP, and GIF are accepted"), "");
        callback(null, randomUUID() + extension);
      },
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => callback(null, file.mimetype.startsWith("image/")),
  }))
  upload(@UploadedFile() file?: { filename: string; originalname: string; mimetype: string; size: number }) {
    if (!file) throw new BadRequestException("Choose an image file");
    const base = this.config.get<string>("MEDIA_PUBLIC_BASE_URL") ?? "http://localhost:3001/api/v1/media";
    return { url: base.replace(/\/$/, "") + "/" + file.filename, name: file.originalname, size: file.size, type: file.mimetype };
  }
}
