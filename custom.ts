namespace music {

    /**
     * Функция для запуска тона в фоне(паралельной задачи).
     * @param frequency pitch of the tone to play in Hertz (Hz), eg: Note.C
     * @param ms tone duration in milliseconds(ms), eg: BeatFraction.Half
     */
    //% blockId="PlayToneInBackground"
    //% block="play tone|at $frequency| for $duration| in the background"
    //% block.loc.ru="проиграть тон $frequency| продолжительностью $duration| в фоне"
    //% frequency.shadow="device_note"
    //% duration.shadow="device_beat"
    //% weight="75" blockGap="8"
    //% group="Tone"
    export function playToneInBackground(frequency: number, duration: number) {
        control.runInParallel(function () {
            music.playTone(frequency, duration);
        });
    }

}

namespace control {

    /**
     * Function to wait for a loop to complete for a specified time.
     * @param startTime start time, eg: 0
     * @param delay waiting time, eg: 10
     */
    //% blockId="PauseUntilTime"
    //% block="wait $delay ms| at start at $startTime"
    //% block.loc.ru="ждать $delay мс| при начале в $startTime|мс"
    //% weight="6"
    export function pauseUntilTime(startTime: number, ms: number) {
        if (startTime == 0) startTime = control.millis();
        const waitCompletionTime = startTime + ms;
        while (control.millis() < waitCompletionTime) loops.pause(0.01);
    }

}