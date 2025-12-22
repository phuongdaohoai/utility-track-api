import { ApiProperty } from '@nestjs/swagger';

export class ImportCsvDto {
    @ApiProperty({ type: 'string', format: 'binary', description: 'File CSV' })
    file: any;
}