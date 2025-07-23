/**
 * Confetti class, a simple holder with some wobble animation.
 */
export class Confetti {
    constructor() {
        this.el = document.createElement('div');
        this.el.classList.add("wsg-confetti");
        this.el.style.backgroundColor = 'hsla(' + Math.round(Math.random() * 360) + ', 100%, 50%, .5)';
        document.body.appendChild(this.el)
        this.x = Math.random();
        this.y = Math.random() * .4 + 1;
        this.offset = Math.random() * Math.PI * 2;
        this.angle = (Math.random() -.5) * Math.PI * 4;
        this.speed = (Math.random() -.5) * Math.PI * 1;
        this.wspeed = Math.random() * .5 + .5;
        this.update(0);
        this.isDeleted = false;
    }
    update(cur) {
        const TAU = Math.PI * 2;
        const HPI = Math.PI * .5;
        let x = window.innerWidth * this.x;
        let y = window.innerHeight * Math.pow(cur, .8) * this.y;
        let radius = window.innerHeight * this.y * .5;
        y -= radius;
        let wobble = HPI + Math.sin(TAU * cur * this.wspeed + this.offset) * .2;
        x += Math.cos(wobble) * radius;
        y +=Math.sin(wobble) * radius;
        let angle = cur * TAU * this.speed + this.offset + (wobble - HPI) * 3 ;
        this.el.style.left = Math.round(x) + 'px';
        this.el.style.top = Math.round(y) + 'px';
        this.el.style.transform = "rotate(" + angle  + "rad)";
    }
    delete() {
        if (!this.isDeleted) {
            document.body.removeChild(this.el);
            this.isDeleted = true;
        }
    }
}