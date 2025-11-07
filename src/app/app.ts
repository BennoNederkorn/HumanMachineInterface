import { Component, signal } from '@angular/core'; 
import { RouterOutlet } from '@angular/router'; // needed?
import {ButtonControl} from './button-control/button-control';

@Component({
  selector: 'app-root',
  imports: [ButtonControl, RouterOutlet ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('HumanMachineInterface');
}
