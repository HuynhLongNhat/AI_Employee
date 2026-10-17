import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });

  app.setGlobalPrefix("api");
  await app.listen(8080);
  console.log("API running on http://localhost:8080/api");
}
bootstrap();