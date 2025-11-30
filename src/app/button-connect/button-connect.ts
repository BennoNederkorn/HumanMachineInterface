import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'button-connect',
  imports: [],
  templateUrl: './button-connect.html',
  styleUrl: './button-connect.scss',
})
export class ButtonConnect implements AfterViewInit {

// ICE: Interactive Connectivity Establishment​
// NAT: Network Address Translator​
// STUN: Session Traversal Utilities for NAT​
// SDP: Session Description Protocol

  // The WebApp needs to find out its own public IP address (TODO because the users is connected to a local network which is behind a NAT) 
  //    - Send a request to a public STUN server.
  //    - A STUN (Session Traversal Utilities for NAT) server will tell the WebApp what its public IP address and port are.
  //    - There are public STUN server which can be used, e.g. provided by Google

  // 1.a WebApp create SDP offer, to describe the session: What data should be received? 
  // 2.a WebApp store this offer as local description.
  // 3.a Send offer to signalling server
  // 4.a The signalling server sends offer to the robot 
  // 5.a Robot stores offer from WebApp as romote description
  // 6.a Robot creates answer also with SDP
  // 7.a Robot stores answer as local description
  // 8.a send answer to the signalling server
  // 9.a Answer is sent from the server back to the WebApp

  // After the WebApp stored SDP offer locally
  // 3.b WebApp's browser starts gathering ICE candidates (local IPs, STUN-discovered OPs, ...)
  // 4.b for each candidate found the onicecandidate event fires
  // 5.b WebApp sends each candidate found to the signalling server
  // 6.b Signalling Server sends each candidate to the robot
  // 7.b robot adds all the ICE candidates to its peer connection

  // After the Robot stores SDP answer locally
  // 8.c  The Robot's browser starts gathering its own ICE candidates.
  // 9.c  For each candidate found, the onicecandidate event fires
  // 10.c Robot sends each candidate to the signaling server.
  // 11.c Signaling server relays each candidate to the WebApp.
  // 12.c The WebApp receives the candidate and adds it to its peer connection.

  // 13. Robot and WebApp perform conectivity checks.
  // 14. Peer to Peer Connecstion is established


  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  // A RTCPeerConnection uses a process called ICE (Interactive Connectivity Establishment)
  // to find the best possible path for two peers to connect, even if they are behind NATs (Network Address Translators) or firewalls.
  private iceConfig = {
    'iceServers': [
      { 'urls': 'stun:stun.l.google.com:19302' },
      { 'urls': 'stun:stun1.l.google.com:19302' }
    ]
  };

  private peerConnection!: RTCPeerConnection;
  private signalingSocket!: WebSocket;
  private signalServerUrl = 'wss://webrtc-handshakeserver.onrender.com';
  // wake up server by visiting: https://webrtc-handshakeserver.onrender.com/

  // Properties for handling the JPEG-over-datachannel video stream
  private videoStreamCanvas?: HTMLCanvasElement; //  A hidden <canvas> element onto which each received image is drawn.
  private videoStreamCanvasCtx?: CanvasRenderingContext2D | null; // The 2D rendering context of the canvas, used for drawing.
  private imageElement = new Image(); // used to load the JPEG data. 
  private lastObjectUrl?: string; // URL string of the previously created image blob. Needed to release the image memory.

  // The WebApp starts the connection, the ESP32 will answer.
  ngAfterViewInit() {}


  onClick() {
    console.log('Creating PeerConnection...');

    
    
    
      // 3.b Create the PeerConnection
      this.peerConnection = new RTCPeerConnection(this.iceConfig);

      // Set up event handlers for the PeerConnection
      this.setupPeerConnectionHandlers();

      // Connect to the Signaling Server
      this.connectToSignalingServer(); 
    
    
    };
    
  private setupPeerConnectionHandlers() {
    // 4.b for each candidate found the onicecandidate event fires
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate:', event.candidate);
        // 5.b WebApp sends each candidate to the signalling server
        this.signalingSocket.send(JSON.stringify({ 'candidate': event.candidate }));
      }
    };

    // This event fires when the remote video stream arrives
    // --> So never because thew ESP is returning raw JPEG bytes
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote video stream!');
      if (this.videoElement.nativeElement.srcObject !== event.streams[0]) {
        this.videoElement.nativeElement.srcObject = event.streams[0];
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      console.log('Data Channel received:', event.channel.label);
      const receiveChannel = event.channel;

      // Prepare the canvas and video element to display the stream
      this.initializeCanvasStream();

      receiveChannel.onmessage = (msgEvent) => {
        // msgEvent.data is a Blob or ArrayBuffer containing the JPEG data
        const blob = new Blob([msgEvent.data], { type: 'image/jpeg' });
        this.lastObjectUrl = URL.createObjectURL(blob);
        this.imageElement.src = this.lastObjectUrl;
      };
    };
  }

  private initializeCanvasStream() {
    // Create a canvas element to render the images on
    this.videoStreamCanvas = document.createElement('canvas');
    this.videoStreamCanvas.width = 640; // TODO
    this.videoStreamCanvas.height = 480;
    this.videoStreamCanvasCtx = this.videoStreamCanvas.getContext('2d');

    // When the image loads, draw it to the canvas and clean up the object URL
    this.imageElement.onload = () => {
      this.videoStreamCanvasCtx?.drawImage(this.imageElement, 0, 0);
      if (this.lastObjectUrl) {
        URL.revokeObjectURL(this.lastObjectUrl);
      }
    };

    // Create a MediaStream from the canvas
    const mediaStream = this.videoStreamCanvas.captureStream(15); // 15 fps

    // Set the stream as the source for the video element
    this.videoElement.nativeElement.srcObject = mediaStream;
  }

  // 3.a Send offer to signalling server
  private connectToSignalingServer() {
    this.signalingSocket = new WebSocket(this.signalServerUrl);

    // Fired when the WebSocket connection is open
    this.signalingSocket.onopen = () => {
      console.log('Signaling WebSocket connected. Creating offer...');
      this.createAndSendOffer();
    };

    // Fired when we receive a message from the signaling server
    this.signalingSocket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log('Signaling message received:', message);

      if (message.answer) {
        // Received the "answer" from the ESP32
        console.log('Received ANSWER from ESP32');
        const remoteDesc = new RTCSessionDescription(message.answer);
        await this.peerConnection.setRemoteDescription(remoteDesc);

      } else if (message.candidate) {
        // 12.c Received an "ICE candidate" from the ESP32
        console.log('Received ICE CANDIDATE from ESP32');
        try {
          await this.peerConnection.addIceCandidate(message.candidate);
        } catch (e) {
          console.error('Error adding received ICE candidate', e);
        }

      } else if (message.offer) {
        // This shouldn't happen in this setup because the WebApp is the offerer
      }
    };

    this.signalingSocket.onclose = () => {
      console.log('Signaling WebSocket closed');
    };

    this.signalingSocket.onerror = (err) => {
      console.error('Signaling WebSocket error:', err);
    };
  }

  private async createAndSendOffer() {
    // Create the WebRTC "offer": receive video
    const offer = await this.peerConnection.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: false
    });
    
    // Set the offer as the "local description"
    await this.peerConnection.setLocalDescription(offer);

    // Send the "offer" to the ESP32 via the signaling server
    console.log('Sending OFFER to ESP32...');
    this.signalingSocket.send(JSON.stringify({ 'offer': offer }));
  }

}
