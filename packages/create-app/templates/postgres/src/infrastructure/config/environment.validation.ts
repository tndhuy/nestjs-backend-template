import { IsString, IsInt, IsIn, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';
}
