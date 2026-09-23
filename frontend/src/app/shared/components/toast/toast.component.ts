import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  imports: [IconComponent],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  toastService = inject(ToastService);
}
