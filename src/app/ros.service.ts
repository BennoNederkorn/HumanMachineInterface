import { Injectable } from '@angular/core';
import * as ROSLIB from 'roslib';

@Injectable({
  providedIn: 'root'
})
export class RosService {
  private ros: ROSLIB.Ros;

  constructor() {
    this.ros = new ROSLIB.Ros({
      url: 'https://jetdaughter-1.tail640ef6.ts.net/' // Jetson's funneled Tailscale URL to http://127.0.0.1:9090
      // This was generated with: sudo tailscale funnel -bg http://127.0.0.1:9090
    });

    this.ros.on('connection', () => {
      console.log('Connected to websocket server (Jetson).');
    });

    this.ros.on('error', (error) => {
      console.log('Error connecting to websocket server (Jetson): ', error);
    });

    this.ros.on('close', () => {
      console.log('Connection to websocket server (Jetson) closed.');
    });
  }

  getRosInstance(): ROSLIB.Ros {
    return this.ros;
  }
}