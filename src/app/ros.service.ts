import { Injectable } from '@angular/core';
import * as ROSLIB from 'roslib';

@Injectable({
  providedIn: 'root'
})
export class RosService {
  private ros: ROSLIB.Ros;

  constructor() {
    this.ros = new ROSLIB.Ros({
      url: 'https://jetdaughter-1.tail640ef6.ts.net/' // Jetson's "local" Tailscale IP
    });

    this.ros.on('connection', () => {
      console.log('Connected to websocket server.');
    });

    this.ros.on('error', (error) => {
      console.log('Error connecting to websocket server: ', error);
    });

    this.ros.on('close', () => {
      console.log('Connection to websocket server closed.');
    });
  }

  getRosInstance(): ROSLIB.Ros {
    return this.ros;
  }
}