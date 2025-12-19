import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebRtcService {
  private socket$: WebSocketSubject<SignalingMessage>;
  private peerConnection?: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;
  private signalServerUrl = 'wss://91.5.180.129:3000'; 

  // Observable for video data chunks
  public videoFrame$ = new Subject<ArrayBuffer>();

  constructor() {
    // Connect to the Secure Signaling Server
    // Replace with the public IP/Domain of the Raspberry Pi
    console.log(`[WebRTC Service] Connecting to signaling server: ${this.signalServerUrl}`);
    this.socket$ = webSocket(this.signalServerUrl);
    
    this.socket$.subscribe(
      msg => this.handleMessage(msg),
      err => console.error('[WebRTC Service] Signaling Error:', err),
      () => console.warn('[WebRTC Service] Signaling connection closed')
    );
  }

  public async startConnection() {
    console.log('[WebRTC Service] Starting WebRTC connection...');
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    this.peerConnection.onconnectionstatechange = () => {
      console.log(`[WebRTC Service] Peer Connection State: ${this.peerConnection?.connectionState}`);
    };

    // 1. Create Data Channel (Initiator Logic)
    // Ordered: false is CRITICAL for low-latency video. 
    // If a frame packet is lost, we don't want to block subsequent frames.
    console.log('[WebRTC Service] Creating data channel...');
    this.dataChannel = this.peerConnection.createDataChannel('video-stream', {
      ordered: false,
      maxRetransmits: 0 
    });

    this.dataChannel.onopen = () => console.log('[WebRTC Service] Data channel is open!');
    this.dataChannel.onclose = () => console.log('[WebRTC Service] Data channel is closed.');

    this.dataChannel.onmessage = (event) => {
      // Pass the raw ArrayBuffer to the component
      this.videoFrame$.next(event.data);
    };

    // 2. Handle ICE Candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC Service] Found ICE candidate, sending to signaling server.');
        this.socket$.next({
          type: 'candidate',
          payload: event.candidate
        });
      } else {
        console.log('[WebRTC Service] All ICE candidates have been sent.');
      }
    };

    // 3. Create Offer
    console.log('[WebRTC Service] Creating offer...');
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    // Send Offer via Signaling
    console.log('[WebRTC Service] Sending offer to signaling server.');
    this.socket$.next({
      type: 'offer',
      payload: offer.sdp
    });
  }

  private async handleMessage(msg: SignalingMessage) {
    if (!this.peerConnection) {
      console.warn('[WebRTC Service] Received signaling message but peer connection is not initialized.');
      return;
    }

    if (msg.type === 'answer') {
      console.log('[WebRTC Service] Received answer from peer.');
      // The ESP32 sent an answer. Set it as Remote Description.
      const answer = { type: 'answer', sdp: msg.payload };
      await this.peerConnection.setRemoteDescription(answer as RTCSessionDescriptionInit);
      console.log('[WebRTC Service] Set remote description with the answer.');
    } else if (msg.type === 'candidate') {
      console.log('[WebRTC Service] Received ICE candidate from peer.');
      // Add the ICE Candidate from the ESP32
      await this.peerConnection.addIceCandidate(msg.payload);
      console.log('[WebRTC Service] Added ICE candidate.');
    }
  }
}