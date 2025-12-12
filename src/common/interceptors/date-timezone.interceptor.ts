import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DateTimezoneInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(data => this.transformDates(data)),
        );
    }

    private transformDates(data: any): any {
        if (data === null || data === undefined) return data;

        if (data instanceof Date) {
            // Convert UTC → GMT+7
            return new Date(data.getTime() + 7 * 60 * 60 * 1000);
        }

        if (Array.isArray(data)) {
            return data.map(item => this.transformDates(item));
        }

        if (typeof data === 'object') {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    data[key] = this.transformDates(data[key]);
                }
            }
        }

        return data;
    }
}