import { Global, Module } from '@nestjs/common';
import { TransactionService, PaginationService } from './services';

@Global()
@Module({
  providers: [TransactionService, PaginationService],
  exports: [TransactionService, PaginationService],
})
export class CommonModule {}