export class PaginationDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}