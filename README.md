# CoreApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Recent Changes

### Client and Restaurant Registration System

#### New Features
- **Registration Dialog**: Complete multi-step form for creating and editing legal customers and restaurants
  - Step 1: General data (legal representative, contact info, status, plan, logo)
  - Step 2: Restaurant data (commercial name, branch, address)
  - Step 3: Documents (optional file uploads)
- **Logo Upload**: Direct upload to Google Cloud Storage via Signed URLs
- **Location Autocomplete**: Automatic state/municipality/neighborhood selection based on postal code
- **Edit Mode**: Smart change detection - only updates modified fields
- **Responsive Design**: Full Bootstrap 5 integration for mobile, tablet, and desktop

#### Technical Implementation
- **Angular 20 Signals**: Reactive state management using `signal()`, `computed()`, and `effect()`
- **Service Layer**: Centralized GraphQL calls in `RegistrationDialogService`
- **File Upload Service**: Generic `GcsUploadService` for uploading files to GCS
- **Observable Management**: All observables use `takeUntilDestroyed` to prevent memory leaks
- **RxJS Operators**: Chained operations for sequential upload → create → create flow

#### Components Structure
```
registration-dialog/
├── registration-dialog.ts (main component)
├── registration-dialog.service.ts (GraphQL service)
└── steps/
    ├── client-data-step.component.ts
    ├── restaurant-data-step.component.ts
    └── documents-step.component.ts
```

#### GraphQL Mutations/Queries
- `getClientLogoUploadConfig`: Get signed URL for logo upload
- `createLegalCustomer`: Create new legal customer
- `updateLegalCustomer`: Partial update of legal customer
- `createRestaurant`: Create restaurant with bootstrap (creates OWNER user)
- `updateRestaurantLocationByCore`: Update only restaurant location (Auth0)

### UI/UX Improvements
- **Header**: Logo from GCS, user name in CapitalCase, simplified logout button
- **Responsive Layout**: Bootstrap grid system for all pages
- **Search Bar**: Moved outside header, 1/3 width on desktop
- **Button Sizing**: Optimized for different breakpoints
- **Login Page**: Enhanced with logo, white background, elevation, and hover animations

### Code Quality
- All `console.log`/`console.error` removed from production code
- JSDOC documentation added to all service methods
- Unused imports removed
- Observable subscriptions properly managed with `takeUntilDestroyed`

### Branding Color Field (January 2025)

#### New Feature
- **Branding Color Selection**: Added `brandColor` field to the legal customer registration form
  - Color picker with text input for hexadecimal code
  - Default color: `#f79300` (orange)
  - Bidirectional synchronization between color picker and text input
  - Validation for hexadecimal format (#RRGGBB)

#### Technical Implementation
- Field added to `step1Group` in registration dialog
- Included in GraphQL mutations (`createLegalCustomer`, `updateLegalCustomer`)
- Responsive layout: 4-column width on desktop, full width on mobile
- Reorganized "Additional Information" section to include Status, Plan, and Branding Color in one row

#### Memory Leak Fixes
- Fixed unclosed observables in `registration-dialog.ts`:
  - `getMunicipalitiesByState()` and `getNeighborhoodsByMunicipality()` now use `takeUntilDestroyed(this.destroyRef)`
  - Dialog `afterClosed()` subscription now uses `takeUntilDestroyed(this.destroyRef)`

For detailed technical context, see [CONTEXT.md](./CONTEXT.md).