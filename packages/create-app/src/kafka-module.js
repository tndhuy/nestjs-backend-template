"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKafkaModule = generateKafkaModule;
const promises_1 = require("fs/promises");
const path_1 = require("path");
async function generateKafkaModule(destDir, serviceName) {
    const kafkaDir = (0, path_1.join)(destDir, 'src', 'kafka');
    await (0, promises_1.mkdir)(kafkaDir, { recursive: true });
    const moduleContent = `import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([{
      name: 'KAFKA_SERVICE',
      useFactory: (configService: ConfigService) => ({
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
          },
          consumer: {
            groupId: \`${serviceName}-consumer-group\`,
          },
        },
      }),
      inject: [ConfigService],
    }]),
  ],
  controllers: [KafkaController],
  exports: [ClientsModule],
})
export class KafkaModule {}
`;
    await (0, promises_1.writeFile)((0, path_1.join)(kafkaDir, 'kafka.module.ts'), moduleContent, 'utf-8');
    const controllerContent = `import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaController {
  @MessagePattern('example-topic')
  handleMessage(@Payload() message: unknown) {
    // TODO: Implement your Kafka message handler
    return message;
  }
}
`;
    await (0, promises_1.writeFile)((0, path_1.join)(kafkaDir, 'kafka.controller.ts'), controllerContent, 'utf-8');
    const barrelContent = `export { KafkaModule } from './kafka.module';
export { KafkaController } from './kafka.controller';
`;
    await (0, promises_1.writeFile)((0, path_1.join)(kafkaDir, 'index.ts'), barrelContent, 'utf-8');
}
//# sourceMappingURL=kafka-module.js.map