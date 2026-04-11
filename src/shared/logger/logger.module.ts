import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { pinoConfig } from './pino.config';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [PinoLoggerModule.forRoot(pinoConfig)],
  providers: [LoggerService],
  exports: [PinoLoggerModule, LoggerService],
})
export class LoggerModule {}
