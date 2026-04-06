import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Generates a Kafka module boilerplate in the scaffolded project.
 *
 * Creates:
 *   src/kafka/kafka.module.ts   — KafkaModule with ClientsModule.registerAsync
 *   src/kafka/kafka.controller.ts — MessagePattern consumer stub
 *   src/kafka/index.ts          — Barrel export
 *
 * Uses ConfigService (not process.env) per project convention.
 */
export async function generateKafkaModule(
  destDir: string,
  serviceName: string,
): Promise<void> {
  const kafkaDir = join(destDir, 'src', 'kafka');

  // Ensure the kafka directory exists
  await mkdir(kafkaDir, { recursive: true });

  // Write kafka.module.ts
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

  await writeFile(join(kafkaDir, 'kafka.module.ts'), moduleContent, 'utf-8');

  // Write kafka.controller.ts
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

  await writeFile(
    join(kafkaDir, 'kafka.controller.ts'),
    controllerContent,
    'utf-8',
  );

  // Write index.ts barrel export
  const barrelContent = `export { KafkaModule } from './kafka.module';
export { KafkaController } from './kafka.controller';
`;

  await writeFile(join(kafkaDir, 'index.ts'), barrelContent, 'utf-8');
}
