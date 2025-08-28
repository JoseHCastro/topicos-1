import { PartialType } from '@nestjs/mapped-types';
import { CreateStudyPlanDto } from './create-study-plan.dto';

export class UpdateStudyPlanDto extends PartialType(CreateStudyPlanDto) {}
