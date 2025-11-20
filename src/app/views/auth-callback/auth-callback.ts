import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'ord-core-auth-callback',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;">
      <p>Procesando autenticación...</p>
    </div>
  `,
})
export class AuthCallback implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.auth.appState$.subscribe((state: any) => {
      const target = state?.target ?? '/app/customers';
      this.router.navigateByUrl(target);
    });

    this.auth.isAuthenticated$.subscribe((isAuth) => {
      if (isAuth) {
        this.router.navigateByUrl('/app/customers');
      }
    });
  }
}


