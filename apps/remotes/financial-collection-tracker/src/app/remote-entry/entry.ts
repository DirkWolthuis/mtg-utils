import { Component } from '@angular/core';
import { NxWelcome } from './nx-welcome';

@Component({
  imports: [NxWelcome],
  selector: 'remote-financial-collection-tracker-entry',
  template: `<remote-nx-welcome></remote-nx-welcome>`,
})
export class RemoteEntry {}
