import { Component } from '@angular/core';
import { NxWelcome } from './nx-welcome';

@Component({
  imports: [NxWelcome],
  selector: 'pt-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'playtester-frontend';
}
