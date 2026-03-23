import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { EmailService } from './auth/email.service';
import { User } from './auth/user.entity';
import { PendingRegistration } from './auth/pending-registration.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM / Postgres configuration. Uses DATABASE_URL if provided,
    // otherwise falls back to individual env vars. `autoLoadEntities`
    // will automatically load entities registered by TypeORM modules.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProd = configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          url: databaseUrl || undefined,
          host: configService.get<string>('DB_HOST') || undefined,
          port: configService.get<number>('DB_PORT') ? Number(configService.get<number>('DB_PORT')) : undefined,
          username: configService.get<string>('DB_USER') || undefined,
          password: configService.get<string>('DB_PASS') || undefined,
          database: configService.get<string>('DB_NAME') || undefined,
          synchronize: !isProd, // enable in dev, disable in production
          logging: !isProd,
          autoLoadEntities: true,
          ssl: isProd ? { rejectUnauthorized: false } : false,
        } as any;
      },
    }),

    TypeOrmModule.forFeature([User, PendingRegistration]),
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService, EmailService],
})
export class AppModule {}
