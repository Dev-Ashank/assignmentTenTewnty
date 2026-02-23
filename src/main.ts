import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable CORS so the API can be called from any frontend
  app.enableCors();

  // Global validation pipe — automatically validates incoming DTOs.
  // whitelist: strips any properties not defined in the DTO (security measure)
  // transform: automatically converts plain objects to DTO instances
  // forbidNonWhitelisted: throws an error if extra properties are sent
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation setup
  // Available at /api/docs once the server is running
  const config = new DocumentBuilder()
    .setTitle('Contest Participation System')
    .setDescription(
      'Backend API for a contest system where users participate in quizzes, ' +
        'get scored, and compete on a leaderboard. Supports role-based access ' +
        '(Admin, VIP, User, Guest) with JWT authentication.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Register, login, and manage your session')
    .addTag('Users', 'User management and role updates')
    .addTag('Contests', 'Contest CRUD operations')
    .addTag('Questions', 'Manage questions within contests')
    .addTag('Participation', 'Join contests, answer questions, submit results')
    .addTag('Leaderboard', 'Contest rankings')
    .addTag('Prizes', 'Prize awarding')
    .addTag('User History', 'View past contests and prizes won')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Server is running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
