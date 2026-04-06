import { ApiProperty } from '@nestjs/swagger';

export class ItemResponseDto {
  @ApiProperty({ description: 'Unique item identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'The name of the item', example: 'My Item' })
  name: string;
}
