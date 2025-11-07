import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonControl } from './button-control';

describe('ButtonControl', () => {
  let component: ButtonControl;
  let fixture: ComponentFixture<ButtonControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonControl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
