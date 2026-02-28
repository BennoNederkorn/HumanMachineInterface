import { Component, inject, signal } from '@angular/core';
import { CameraViewComponent } from './camera-view.component/camera-view.component';

@Component({
  selector: 'app-root',
  imports: [CameraViewComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('HumanMachineInterface');

}
