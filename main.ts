let CHASSIS_L_MOTOR = motors.mediumB; // Ссылка на объект левого мотора в шасси
let CHASSIS_R_MOTOR = motors.mediumC; // Ссылка на объект правого мотора в шасси

let LIGHT_SEN_1 = sensors.nxtLight1; // Ссылка на объект крайнего левого датчика отражения
let LIGHT_SEN_2 = sensors.nxtLight2; // Ссылка на объект центрального левого датчика отражения
let LIGHT_SEN_3 = sensors.nxtLight3; // Ссылка на объект центрального правого датчика отражения
let LIGHT_SEN_4 = sensors.nxtLight4; // Ссылка на объект крайнего правого датчика отражения

let B_REF_RAW_LS1 = 2248; // Сырое значение на чёрном для левого датчика цвета
let W_REF_RAW_LS1 = 1420; // Сырое значение на белом для левого датчика цвета
let B_REF_RAW_LS2 = 2200; // Сырое значение на чёрном для левого датчика цвета
let W_REF_RAW_LS2 = 1280; // Сырое значение на белом для левого датчика цвета
let B_REF_RAW_LS3 = 2016; // Сырое значение на чёрном для правого датчика цвета
let W_REF_RAW_LS3 = 1340; // Сырое значение на белом для правого датчика цвета
let B_REF_RAW_LS4 = 2140; // Сырое значение на чёрном для левого датчика цвета
let W_REF_RAW_LS4 = 1332; // Сырое значение на белом для левого датчика цвета

let WHEELS_D = 95; // Диаметр колёс в мм
let WHEELS_W = 135; // Расстояние между центрами колёс в мм

let LINE_REF_TRESHOLD = 50 // Среднее значение серого (уставка) для определения границы линии
let LW_TRESHOLD = 35; // Пороговое значение определения перекрёстка
let LW_SET_POINT = LINE_REF_TRESHOLD; // Среднее значение серого

let DIST_ROLLING_AFTER_INTERSECTION = 50; // Дистанция для проезда после опредения перекрёстка для прокатки в мм
let DIST_ROLLING_MOVE_OUT = 20; // Дистанция для прокатки без торможения на перекрёстке в мм

// Примеры установки параметров для методов с регулятором
// { speed: 50 } - только скорость
// { speed: 50, Kp: 0.5 } - скорость и Kp
// { speed: 50, Kp: 0.5, Kd: 2 } - скорость, Kp и Kd
// { speed: 50, Kp: 0.5, Ki: 0, Kd: 2 } - скорость, Kp, Ki, Kd

function Main() { // Определение главной функции
    for (let i = 0; i < 10; i++) { // Опрашиваем какое-то количество раз датчики, чтобы они включились перед стартом по нажатию кнопки
        LIGHT_SEN_1.light(NXTLightIntensityMode.ReflectedRaw);
        LIGHT_SEN_2.light(NXTLightIntensityMode.ReflectedRaw);
        LIGHT_SEN_3.light(NXTLightIntensityMode.ReflectedRaw);
        LIGHT_SEN_4.light(NXTLightIntensityMode.ReflectedRaw);
        loops.pause(5);
    }

    // Установка коэффицентов движения по линии двумя датчиками
    motions.lineFollow4SensorSpeed = 20;
    motions.lineFollow4SensorKp = 0.5;
    motions.lineFollow4SensorKd = 0;
    motions.lineFollow4SensorSideSensCoef = 6;

    CHASSIS_L_MOTOR.setInverted(true); CHASSIS_R_MOTOR.setInverted(false); // Установка реверсов в шасси

    brick.printString("PRESS ENTER TO RUN", 7, 6); // Вывести на экран сообщение о готовности
    while (true) {
        if (brick.buttonLeft.wasPressed()) custom.FunctionsTune(0, true);
        else if (brick.buttonRight.wasPressed()) break; // Ожидание нажатия правой кнопки, чтобы выйти и пойти дальше по коду
        loops.pause(0.001);
    }
    brick.clearScreen(); // Очистить экрана

    // Ваш код тут
    motions.LineFollow4SensorWithLossProtection(null, true);
}

Main(); // Вызов главной функции