import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origins = (config.get<string>("WEB_ORIGIN") ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

  app.setGlobalPrefix("api/v1");
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableShutdownHooks();

  const port = Number(config.get<string>("PORT") ?? 3001);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
