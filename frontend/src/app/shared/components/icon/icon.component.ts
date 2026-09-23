import { Component, input } from '@angular/core';

export type IconName =
  | 'book'
  | 'users'
  | 'plus'
  | 'minus'
  | 'search'
  | 'alert'
  | 'refresh'
  | 'package'
  | 'warning'
  | 'x-circle'
  | 'rupee'
  | 'check'
  | 'close'
  | 'arrow-left'
  | 'arrow-right'
  | 'trash'
  | 'more'
  | 'download';

// small set of line icons (paths taken from lucide.dev), so we don't need an icon library
@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css'
})
export class IconComponent {
  name = input.required<IconName>();
  size = input(18);
}
