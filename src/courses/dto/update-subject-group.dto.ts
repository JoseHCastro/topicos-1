import { PartialType } from '@nestjs/mapped-types';
import { CreateSubjectGroupDto } from './create-subject-group.dto';

export class UpdateSubjectGroupDto extends PartialType(CreateSubjectGroupDto) {}