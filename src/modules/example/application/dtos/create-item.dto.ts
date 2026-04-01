import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ description: 'The name of the item', example: 'My Item' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
