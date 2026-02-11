import { NxWelcome } from './nx-welcome';
import { Route } from '@angular/router';
import { loadRemote } from '@module-federation/enhanced/runtime';

export const appRoutes: Route[] = [
  {
    path: 'financial-collection-tracker',
    loadChildren: () =>
      loadRemote<typeof import('financial-collection-tracker/Routes')>(
        'financial-collection-tracker/Routes',
      ).then((m) => m!.remoteRoutes),
  },
  {
    path: '',
    component: NxWelcome,
  },
];
