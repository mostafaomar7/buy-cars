import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { filter, finalize } from 'rxjs';
import { AdminApi } from '../../core/admin-api.service';
import { errorCode, errorMessage } from '../../core/api-error';
import { LiveEventsService } from '../../core/live-events.service';
import { AccessRequest } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { RiyadhDatePipe } from '../../shared/riyadh-date.pipe';
import { Avatar } from '../../shared/ui/avatar';
import { Icon } from '../../shared/ui/icon';
import { Modal } from '../../shared/ui/modal';
import { StatusBadge } from '../../shared/ui/status-badge';
import { UserInfo } from '../../shared/ui/user-info';

type Decision = 'approve' | 'reject';

@Component({
  selector: 'app-request-detail-page',
  imports: [RouterLink, ReactiveFormsModule, Avatar, StatusBadge, UserInfo, Modal, Icon, RiyadhDatePipe],
  templateUrl: './request-detail-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestDetailPage implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly toast = inject(ToastService);

  /** من الرابط `/requests/:id` */
  readonly id = input.required<string>();

  protected readonly request = signal<AccessRequest | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly decision = signal<Decision | null>(null);
  protected readonly saving = signal(false);
  protected readonly reason = new FormControl('', { nonNullable: true, validators: Validators.maxLength(500) });

  constructor() {
    inject(LiveEventsService)
      .on('access_request.decided')
      .pipe(
        filter((event) => event.data['requestId'] === this.id()),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.api.getRequest(this.id()).subscribe({
      next: (request) => this.request.set(request),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  protected open(decision: Decision): void {
    this.reason.reset('');
    this.decision.set(decision);
  }

  protected close(): void {
    this.decision.set(null);
  }

  protected confirm(): void {
    const decision = this.decision();
    if (!decision || this.reason.invalid) return;

    const reason = this.reason.value.trim() || undefined;
    const request$ =
      decision === 'approve' ? this.api.approveRequest(this.id(), reason) : this.api.rejectRequest(this.id(), reason);

    this.saving.set(true);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (request) => {
        this.request.set(request);
        this.decision.set(null);
        this.toast.success(decision === 'approve' ? 'تم قبول الطلب' : 'تم رفض الطلب');
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        if (errorCode(err) === 'REQUEST_ALREADY_REVIEWED') {
          this.decision.set(null);
          this.load();
        }
      },
    });
  }
}
