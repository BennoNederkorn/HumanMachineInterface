import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonConnect } from './button-connect';

describe('ButtonConnect', () => {
  let component: ButtonConnect;
  let fixture: ComponentFixture<ButtonConnect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonConnect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonConnect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
