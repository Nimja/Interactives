class Cam {
    constructor(switchCamButton) {
        this.video;
        this.camCount = 0;
        this.isFront = true;
        this.setCamMode(false); // Default cam mode.
        this.current_stream = false;
        if (typeof switchCamButton != 'undefined') {
            this.switchCamButton = switchCamButton;
            this.switchCamButton.addEventListener('click', this.switchCamEvent.bind(this));
        } else {
            this.switchCamButton = false;
        }
    }

    setCamMode(isFront) {
        this.isFront = isFront;
        this.camFacingMode = !this.isFront ? 'environment' : 'user';
    }

    hasData() {
        return this.video.readyState === this.video.HAVE_ENOUGH_DATA
    }

    switchCamEvent(e) {
        e.preventDefault();
        if (this.camCount > 1) { // Toggle cam mode if we can.
            this.setCamMode(!this.isFront);
        }
        this.switchCam(e);
    }

    getSize() {
        return { w: this.video.videoWidth, h: this.video.videoHeight };
    }

    async enableCam(e) {
        if (navigator.mediaDevices) {
            this.video = document.createElement('video');
            this.video.autoplay = true;
            this.video.setAttribute('webkit-playsinline', 'webkit-playsinline');
            this.video.setAttribute('playsinline', 'playsinline');
            this.cam_count = 0;
            this.switchCam(e);
        }
    }
    async switchCam(e) {
        if (!this.video) {
            return;
        }
        // Stop previous tracks.
        if (this.current_stream) {
            let tracks = await this.current_stream.getTracks();
            tracks.forEach(track => track.stop());
        }

        let config = { // Only use video, no audio.
            audio: false,
            video: { facingMode: this.camFacingMode }, // Always ask for outward facing camera by default.
        }
        try {
            this.current_stream = await navigator.mediaDevices.getUserMedia(config);
            this.detectCameraSettings();

            this.video.srcObject = this.current_stream;
            this.video.play();
            this.video.style.display = 'block';
            // Next time, we switch cam.
        } catch (e) {
            this.current_stream = null;
            this.video.style.display = 'none';
            console.log(e);
        }
    }

    /**
     * Detect camera options, can we switch between them?
     */
    async detectCameraSettings() {
        if (this.camCount > 0) {
            return;
        }

        let mediaDevices = await navigator.mediaDevices.enumerateDevices();
        mediaDevices.forEach((info) => {
            if (info.kind == 'videoinput') {
                this.camCount++;
            }
        });
        if (this.switchCamButton) {
            this.switchCamButton.style.display = this.camCount > 1 ? 'block' : 'none';
        }
        if (this.camCount == 1) { // If a single camera, then assume front facing.
            this.setCamMode(true);
        }
    }

}