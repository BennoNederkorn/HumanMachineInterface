import { Component, inject } from '@angular/core';
import { JoystickComponent } from '../joystick.component/joystick.component';
import * as ROSLIB from 'roslib';
import { RosService } from '../ros.service';

@Component({
  selector: 'app-joystick-container',
  imports: [JoystickComponent],
  templateUrl: './joystick-container.component.html',
  styleUrl: './joystick-container.component.scss',
})
export class JoystickContainerComponent {
  // TODO: Import and inject your actual RosService here.
  protected rosService = inject(RosService);
  protected aiEnabled = false;
  protected head_direction = 0.0;
  protected head_force = 0.0;
  protected body_direction = 0.0;
  protected body_force = 0.0;


  sendHMICommands() {
    const hmiCmds = new ROSLIB.Topic({
      ros: this.rosService.getRosInstance(),
      name: '/hmi_cmds',
      messageType: 'bb8_cmd_receiver/HMICmds'
    });

    const hmi_cmds = {
      ai_mode: this.aiEnabled,
      head_direction: this.head_direction,
      head_force: this.head_force,
      body_direction: this.body_direction,
      body_force: this.body_force
    };

    hmiCmds.publish(hmi_cmds as any);
  }

  onJoystickMove(data: any, type: 'head' | 'body') {
    // data.vector, data.angle, data.force, etc.
    console.log('Direction:', data.angle.degree, '   Force:', data.force);

    if (type === 'head') {
      this.head_direction = data.angle.degree;
      this.head_force = data.force;
    }
    else {
      this.body_direction = data.angle.degree;
      this.body_force = data.force;
    }
    this.sendHMICommands();
  }

  onJoystickStart() {
    console.log('Joystick pressed');
  }

  onJoystickEnd(type: 'head' | 'body') {
    console.log('Joystick released');
    if (type === 'head') {
      this.head_direction = 0.0;
      this.head_force = 0.0;
    }
    else {
      this.body_direction = 0.0;
      this.body_force = 0.0;
    }
    this.sendHMICommands();
  }

  onClick() {
    console.log('Toggel AI was clicked');
    this.aiEnabled = !this.aiEnabled;
    this.sendHMICommands();
  }
}
