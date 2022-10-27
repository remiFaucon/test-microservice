class Face {
    _timeout;
    _names;
    _landmarks;
    constructor() {}

    set names(names) {
        this._names = names
    }

    set landmarks(landmarks) {
        this._landmarks = landmarks
    }

    set timeout(timeout) {
        this._timeout = timeout
    }

    get getTimeout() {
        return this._timeout
    }

    get getLandmarks() {
        return this._landmarks
    }
    get getNames() {
        return this._names
    }


    face = () => {
        console.log("face", this._names)
        console.log("face", this._landmarks)
        // return {
        //     names: this.getNames(),
        //     landmarks: this.getLandmarks(),
        //     // timeout: this.timeout()
        // }
    }
}

module.exports = Face