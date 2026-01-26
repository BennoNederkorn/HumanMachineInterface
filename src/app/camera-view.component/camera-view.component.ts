import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JoystickContainerComponent } from '../joystick-container.component/joystick-container.component';


@Component({
  selector: 'app-camera-view',
  imports: [CommonModule, JoystickContainerComponent],
  templateUrl: './camera-view.component.html',
  styleUrl: './camera-view.component.scss',
})
export class CameraViewComponent implements OnInit, OnDestroy {
  // CONFIGURATION
  // Input: The Tailscale Funnel URL (e.g., "https://my-pi.tailnet.ts.net/offer")
  @Input() signalingUrl: string = '';
  // Input: Optional secret key if you added security to Python
  @Input() apiKey: string = '';

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  private pc: RTCPeerConnection | null = null;
  private whepSessionUrl: string | null = null;
  public status: 'init' | 'connecting' | 'connected' | 'error' | 'offline' = 'init';
  public errorMessage: string = '';

  ngOnInit(): void {
    if (this.signalingUrl) {
      this.startStream();
    } else {
      this.status = 'error';
      this.errorMessage = 'No Signaling URL provided.';
    }
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  async startStream() {
    this.status = 'connecting';
    this.errorMessage = '';

    try {
      // 1. Initialize WebRTC
      const config: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      this.pc = new RTCPeerConnection(config);

      // 2. Prepare to receive video
      // We add a transceiver to tell WebRTC we want to receive video, 
      // even if we aren't sending any.
      this.pc.addTransceiver('video', { direction: 'recvonly' });

      // 3. Handle incoming stream
      this.pc.ontrack = (event) => {
        console.log("Track received:", event.streams[0]);
        if (this.videoPlayer && this.videoPlayer.nativeElement) {
          this.videoPlayer.nativeElement.srcObject = event.streams[0];
          this.status = 'connected';
          this.videoPlayer.nativeElement.muted = true; // Prevent NotAllowedError: Browsers like to block autoplay
          this.videoPlayer.nativeElement.play().catch(err => console.error('Error playing video:', err));
        }
      };

      this.pc.oniceconnectionstatechange = () => {
        console.log("ICE State:", this.pc?.iceConnectionState);
        if (this.pc?.iceConnectionState === 'disconnected') {
          this.status = 'offline';
        }
      };

      // 4. Create Offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 5. Send Offer to Raspberry Pi (Signaling via Tailscale Funnel)
      // We wait for ICE gathering to complete or just send what we have. 
      // For simple setups, sending immediately usually works.
      await this.waitToGatherIceCandidates();

      // WHEP: POST SDP offer, receive SDP answer
      const response = await fetch(this.signalingUrl, {
        method: 'POST',
        // body: JSON.stringify({
        //   sdp: this.pc.localDescription?.sdp,
        //   type: this.pc.localDescription?.type
        // }),
        headers: {
          // 'Content-Type': 'application/json',
          // 'Authorization': this.apiKey // Send key if configured
          'Content-Type': 'application/sdp',
          'Accept': 'application/sdp'
        },
        body: this.pc.localDescription?.sdp || ''
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.statusText}`);
      }

      // 6. Handle Answer from Pi
      // Save WHEP session URL (Location header) for cleanup
      this.whepSessionUrl = response.headers.get('Location');

      const answerSdp = await response.text();
      await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err: any) {

      this.status = 'error';
      this.errorMessage = err.message || 'Could not connect to camera.';
    }
  }

  async stopStream() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.whepSessionUrl) {
      try { await fetch(this.whepSessionUrl, { method: 'DELETE' }); } catch { }
      this.whepSessionUrl = null;
    }
    this.status = 'init';
  }

  // Helper: Wait for ICE candidates (optional but improves connection success)
  private waitToGatherIceCandidates(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.pc || this.pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      const checkState = () => {
        if (this.pc?.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };
      this.pc.addEventListener('icegatheringstatechange', checkState);
      // Timeout after 2 seconds to avoid waiting forever
      setTimeout(resolve, 2000);
    });
  }
}