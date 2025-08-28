import { Global, Module } from '@nestjs/common';
import { TransactionService } from './services';

@Global()
@Module({
  providers: [TransactionService],
  exports: [TransactionService],
})
export class CommonModule {}