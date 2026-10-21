import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { errorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { BrandMark } from '../../shared/ui/brand-mark';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, BrandMark],
  templateUrl: './login-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { identifier, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);

    this.auth
      .login(identifier.trim(), password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => this.error.set(errorMessage(err)),
      });
  }
}
