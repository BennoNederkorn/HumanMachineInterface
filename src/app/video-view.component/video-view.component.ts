import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { WebRtcService } from '../web-rtc.service';
import { JoystickContainerComponent } from '../joystick-container.component/joystick-container.component';

@Component({
  selector: 'app-video-view',
  imports: [CommonModule, JoystickContainerComponent],
  templateUrl: './video-view.component.html',
  styleUrl: './video-view.component.scss',
})
export class VideoViewComponent implements OnInit, OnDestroy {
  imgSrc?: SafeUrl;
  private currentObjectUrl?: string;

  constructor(private rtcService: WebRtcService, private sanitizer: DomSanitizer) { }

  ngOnInit() {
    console.log('[VideoView] Component initialized.');
    this.rtcService.videoFrame$.subscribe((data: ArrayBuffer) => {
      // console.log(`[VideoView] Received video frame: ${data.byteLength} bytes`);
      // Create a Blob from the ArrayBuffer
      const blob = new Blob([data], { type: 'image/jpeg' });

      // Revoke the old URL to prevent memory leaks (Critical for long-running streams)
      if (this.currentObjectUrl) {
        URL.revokeObjectURL(this.currentObjectUrl);
      }

      this.currentObjectUrl = URL.createObjectURL(blob);

      // Sanitize the URL for Angular to trust it
      this.imgSrc = this.sanitizer.bypassSecurityTrustUrl(this.currentObjectUrl);
    });
  }

  startStream() {
    console.log('[VideoView] Start Stream button clicked.');
    this.rtcService.startConnection();
  }

  ngOnDestroy() {
    console.log('[VideoView] Component destroyed. Cleaning up object URL.');
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
    }
  }
}