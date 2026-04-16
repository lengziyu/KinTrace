import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  unknown
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'ok',
        data,
      })),
    );
  }
}
