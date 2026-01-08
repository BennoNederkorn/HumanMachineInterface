import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import nipplejs from 'nipplejs';

@Component({
  selector: 'app-joystick',
  standalone: true,
  templateUrl: './joystick.component.html',
  styleUrl: './joystick.component.scss',
})
export class JoystickComponent implements AfterViewInit, OnDestroy {
  // Access the DOM element
  @ViewChild('joystickContainer') joystickContainer!: ElementRef;

  // Output events to parent component
  @Output() move = new EventEmitter<any>();
  @Output() end = new EventEmitter<void>();

  // Input to restrict movement to X axis (horizontal)
  @Input() lockX = false;

  private manager: nipplejs.JoystickManager | undefined;

  ngAfterViewInit() {
    // nipplejs requires the DOM to be rendered, so we initialize here
    this.initJoystick();
  }

  ngOnDestroy() {
    // Clean up to prevent memory leaks
    if (this.manager) {
      this.manager.destroy();
    }
  }

  private initJoystick() {
    const options: nipplejs.JoystickManagerOptions = {
      zone: this.joystickContainer.nativeElement,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'black',
      size: 100,
      lockX: this.lockX
    };

    this.manager = nipplejs.create(options);

    // Listen to nipplejs events and emit them to Angular
    this.manager.on('move', (evt, data) => {
      this.move.emit(data);
    });

    this.manager.on('end', () => {
      this.end.emit();
    });
  }
}