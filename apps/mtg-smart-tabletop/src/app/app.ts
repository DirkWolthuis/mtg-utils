import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  imports: [RouterModule, MatSlideToggle],
  selector: 'stt-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'mtg-smart-tabletop';
}
