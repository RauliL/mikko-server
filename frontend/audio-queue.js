export default class AudioQueue {
  constructor () {
    this.audio = new Audio();
    this.queue = [];
    this.isCurrentlyPlaying = false;

    this.audio.addEventListener('ended', () => {
      this.isCurrentlyPlaying = false;
      this.play();
    });
  }

  add (url) {
    this.queue.push(url);
    if (!this.isCurrentlyPlaying) {
      this.play();
    }
  }

  play () {
    if (!this.isCurrentlyPlaying && this.queue.length > 0) {
      const url = this.queue[0];

      this.isCurrentlyPlaying = true;
      this.queue.shift();
      this.audio.src = url;
      this.audio.play();
    }
  }
}
