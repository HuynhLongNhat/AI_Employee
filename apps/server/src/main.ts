import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix("api");
  await app.listen(8080);
  app.getHttpAdapter().get("/api/hello", (req, res) => {
    res.send("Hello World!");
  });
  console.log("API running on http://localhost:8080/api");
}
bootstrap();
