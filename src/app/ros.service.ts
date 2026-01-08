import { Injectable } from '@angular/core';
import * as ROSLIB from 'roslib';

@Injectable({
  providedIn: 'root'
})
export class RosService {
  private ros: ROSLIB.Ros;

  constructor() {
    this.ros = new ROSLIB.Ros({
      url: 'ws://172.17.0.1:9090' // Replace with Jetson's local IP (TODO Tailscale, talk to Lee)
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