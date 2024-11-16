import { join } from 'path';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { APP_GUARD } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { LoggerModule, AppLogger } from '@atisiothings/laniakea-lib-audit';
import { AuthClientModule } from '@atisiothings/laniakea-lib-http/dist/modules/auth.module';
import { CorsMiddleware } from '@atisiothings/laniakea-lib-http/dist/middleware/cors.middleware'; 

// TODO: Add health controller
import { HealthController } from '@atisiothings/laniakea-lib-http/dist/framework/controller/health.controller'; 

import { AuthGuard } from '@/security/auth.guard';

const routes = [
  '*/*', //TODO: CONFIGURE ROUTES FOR CORS!!!
]

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({ level: 'debug' }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),     
    PrometheusModule.register({
      path: '/metrics',  // This will expose the metrics endpoint at /metrics
      defaultMetrics: {
        enabled: true,    // Enable default system metrics (CPU, memory, etc.)
      },
    }),    
    AuthClientModule.forRoot(`${process.env.AUTH_SERVER_HOST}:${process.env.AUTH_SERVER_PORT}`),
  ],
  providers: [
    AppLogger,
    {provide: APP_GUARD, useClass: AuthGuard},
  ],
  exports: [AppLogger],
  controllers: [
    HealthController,
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware)
      .forRoutes(...routes);
  }
}
