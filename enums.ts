// Перечисление о вариантах работы манипулятора
const enum ClawState {
    //% block="open"
    //% block.loc.ru="открыть"
    Open,
    //% block="close"
    //% block.loc.ru="закрыть"
    Close
}

// Перечисление о типах торможения полный вариант
const enum AfterMotion {
    //% block="rolling"
    //% block.loc.ru="прокатка"
    Rolling,
    //% block="decel rolling"
    //% block.loc.ru="плавная прокатка"
    DecelRolling,
    //% block="rolling no stop"
    //% block.loc.ru="прокатка без торможения"
    RollingNoStop,
    //% block="brake stop"
    //% block.loc.ru="тормоз с удержанием"
    BreakStop,
    //% block="no break stop"
    //% block.loc.ru="тормоз с инерцией"
    NoBreakStop,
    //% block="no stop"
    //% block.loc.ru="не тормозить"
    NoStop
}

// Перечисление о типах торможения сокращённый вариант
const enum AfterMotionShort {
    //% block="brake stop"
    //% block.loc.ru="тормоз с удержанием"
    BreakStop,
    //% block="no break stop"
    //% block.loc.ru="тормоз с инерцией"
    NoBreakStop,
    //% block="no stop"
    //% block.loc.ru="не тормозить"
    NoStop
}