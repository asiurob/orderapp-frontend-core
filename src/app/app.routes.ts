import {Routes} from '@angular/router';
import {AuthGuard} from '@auth0/auth0-angular';

export const routes: Routes = [{
    path: 'login',
    loadComponent: () => import('./views/login/login').then(m => m.Login)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./views/auth-callback/auth-callback').then(m => m.AuthCallback)
  },

  {
    path: 'app',
    loadComponent: () => import('./views/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [AuthGuard],
    children: [{
        path: '',
        redirectTo: 'formulario',
        pathMatch: 'full'
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./views/dashboard/pages/plans/plans').then(m => m.Plans)
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./views/dashboard/pages/registered-client/registered-client').then(m => m.RegisteredClient)
      },
    ],
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'not-allowed',
    loadComponent: () => import('./views/not-allowed/not-allowed').then(m => m.NotAllowed)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./views/not-found/not-found').then(m => m.NotFound)
  },
  {
    path: 'under-construction',
    loadComponent: () => import('./views/under-construction/under-construction').then(m => m.UnderConstruction)
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];
