import { PartialType } from '@nestjs/mapped-types';
import { CreateDegreeProgramDto } from './create-degree-program.dto';

export class UpdateDegreeProgramDto extends PartialType(CreateDegreeProgramDto) {}

