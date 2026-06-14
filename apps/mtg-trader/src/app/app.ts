import { CdkDrag } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule, MatSlideToggle, CdkDrag],
  selector: 'stt-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'mtg-smart-tabletop';
}
