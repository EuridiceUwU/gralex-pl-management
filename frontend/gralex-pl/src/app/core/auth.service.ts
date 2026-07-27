import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_BASE } from './api.config';
import { AuthUser, LoginResponse } from './models';

const TOKEN_KEY = 'gralex_token';
const USER_KEY = 'gralex_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(this.readStoredUser());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'Administrador');
  // True while the account still holds its temporary password and must change
  // it before using the rest of the app.
  readonly mustChangePassword = computed(() => this._user()?.must_change_password === true);

  constructor(private readonly http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this._user.set(res.user);
        }),
      );
  }

  changePassword(newPassword: string): Observable<{ ok: boolean; message: string }> {
    return this.http
      .post<{ ok: boolean; message: string }>(`${API_BASE}/auth/change-password`, { newPassword })
      .pipe(
        tap(() => {
          // Clear the temporary-password flag locally so guards let the user
          // into the rest of the app without needing a fresh login.
          const current = this._user();
          if (current) {
            const updated = { ...current, must_change_password: false };
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            this._user.set(updated);
          }
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }
}
