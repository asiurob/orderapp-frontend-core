import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotAllowed } from './not-allowed';

describe('NotAllowed', () => {
  let component: NotAllowed;
  let fixture: ComponentFixture<NotAllowed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotAllowed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotAllowed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
