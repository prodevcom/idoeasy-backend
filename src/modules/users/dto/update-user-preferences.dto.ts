import { UpdateUserPreferencesRequest } from '@entech/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserPreferencesDto implements UpdateUserPreferencesRequest {
  @ApiProperty({
    description: 'User locale preference (e.g., "en-GB", "pt-BR")',
    example: 'en-GB',
    required: false,
  })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({
    description: 'User timezone preference (e.g., "America/Sao_Paulo", "UTC")',
    example: 'America/Sao_Paulo',
    required: false,
  })
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiProperty({
    description:
      'Whether to show timezone offset in date displays (e.g., GMT+3)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  showTimezoneOffset?: boolean;
}
