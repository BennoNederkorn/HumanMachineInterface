import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // needed?
import { ButtonControl } from './button-control/button-control';
import { ButtonConnect } from './button-connect/button-connect';
import { VideoViewComponent } from './video-view.component/video-view.component';
import { JoystickContainerComponent } from './joystick-container.component/joystick-container.component';

// import {WebRtcService} from './web-rtc.service';

@Component({
  selector: 'app-root',
  imports: [ButtonControl, ButtonConnect, VideoViewComponent, RouterOutlet, JoystickContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('HumanMachineInterface');

}
