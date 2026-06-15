import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Game } from './game';

@Component({
  selector: 'gui-root',
  template: '<gui-game />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Game],
})
export class App {}
