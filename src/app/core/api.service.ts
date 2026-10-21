import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiSuccess, QueryParams } from './models';

export const API_URL = `${environment.apiUrl}/api/v1`;

type Headers = Record<string, string>;

/** غلاف بسيط حول HttpClient يفك غلاف `{ success, data }` ويرجع `data` مباشرة. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, query?: QueryParams): Observable<T> {
    return this.unwrap(this.http.get<ApiSuccess<T>>(API_URL + path, { params: toParams(query) }));
  }

  post<T>(path: string, body: unknown = {}, headers?: Headers): Observable<T> {
    return this.unwrap(this.http.post<ApiSuccess<T>>(API_URL + path, body, { headers }));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.patch<ApiSuccess<T>>(API_URL + path, body));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.put<ApiSuccess<T>>(API_URL + path, body));
  }

  delete<T>(path: string): Observable<T> {
    return this.unwrap(this.http.delete<ApiSuccess<T>>(API_URL + path));
  }

  private unwrap<T>(request: Observable<ApiSuccess<T> | null>): Observable<T> {
    return request.pipe(map((res) => res?.data as T));
  }
}

function toParams(query: QueryParams = {}): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
