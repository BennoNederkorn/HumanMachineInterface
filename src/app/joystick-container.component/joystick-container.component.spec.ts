import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoystickContainerComponent } from './joystick-container.component';

describe('JoystickContainerComponent', () => {
  let component: JoystickContainerComponent;
  let fixture: ComponentFixture<JoystickContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoystickContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoystickContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
