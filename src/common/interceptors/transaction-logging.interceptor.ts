import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class TransactionLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const startTime = Date.now();

    if (url.includes('atomic-enrollment') || url.includes('enroll')) {
      this.logger.log(`Iniciando transacción: ${method} ${url}`, {
        timestamp: new Date().toISOString(),
        method,
        url,
        bodyKeys: Object.keys(body || {}),
      });
    }

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;

        if (url.includes('atomic-enrollment') || url.includes('enroll')) {
          this.logger.log(
            `Transacción exitosa: ${method} ${url} - ${duration}ms`,
            {
              timestamp: new Date().toISOString(),
              method,
              url,
              duration,
              success: response?.success || true,
            },
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        if (url.includes('atomic-enrollment') || url.includes('enroll')) {
          this.logger.error(
            ` Transacción fallida: ${method} ${url} - ${duration}ms`,
            {
              timestamp: new Date().toISOString(),
              method,
              url,
              duration,
              error: error.message,
              statusCode: error.status,
            },
          );
        }

        throw error;
      }),
    );
  }
}
