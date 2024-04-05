namespace motions {

    export let lineFollow4SensorSpeed = 50; // Переменная для хранения скорости при движения по линии четыремя датчиками
    export let lineFollow4SensorKp = 1; // Переменная для хранения коэффицента пропорционального регулятора при движения по линии четыремя датчиками
    export let lineFollow4SensorKi = 0; // Переменная для хранения коэффицента интегорального регулятора при движения по линии четыремя датчиками
    export let lineFollow4SensorKd = 0; // Переменная для хранения коэффицента дифференциального регулятора при движения по линии четыремя датчиками
    export let lineFollow4SensorN = 0; // Переменная для хранения коэффицента фильтра дифференциального регулятора при движения по линии четыремя датчиками
    export let lineFollow4SensorSideSensCoef = 4; // Переменная для хранения коэффицента усиления крайних датчиков при движения по линии четыремя датчиками

    export function LineFollow4SensorWithLossProtection(params?: automation.LineFollowInterface, debug: boolean = false) {
        // Движение по линии с волновым регулятором (PID + защита от слёта с линии)

        if (params) { // Если были переданы параметры
            if (params.speed) lineFollow4SensorSpeed = Math.abs(params.speed);
            if (params.Kp) lineFollow4SensorKp = params.Kp;
            if (params.Ki) lineFollow4SensorKi = params.Ki;
            if (params.Kd) lineFollow4SensorKd = params.Kd;
            if (params.N) lineFollow4SensorN = params.N;
            if (params.C) lineFollow4SensorSideSensCoef = params.N;
        }

        automation.pid1.setGains(lineFollow4SensorKp, lineFollow4SensorKi, lineFollow4SensorKd); // Установка коэффицентов регулятора
        automation.pid1.setDerivativeFilter(lineFollow4SensorN); // Установить фильтр дифференциального регулятора
        automation.pid1.setControlSaturation(-200, 200); // Установка диапазона регулирования регулятора
        automation.pid1.reset(); // Сброс регулятора

        control.timer8.reset();
        control.timer1.reset();
        let lastSensor = 2; // Переменная для хранения последнего сенсора, который видел линию, изначально центральный
        let prevTime = 0; // Переменная предыдущего времения для цикла регулирования
        while (true) {
            if (control.timer8.millis() > 1000 && brick.buttonEnter.wasPressed()) break;
            let currTime = control.millis(); // Текущее время
            let dt = currTime - prevTime; // Время за которое выполнился цикл
            prevTime = currTime; // Новое время в переменную предыдущего времени
            let refRawLS1 = LIGHT_SEN_1.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS2 = LIGHT_SEN_2.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS3 = LIGHT_SEN_3.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS4 = LIGHT_SEN_4.light(NXTLightIntensityMode.ReflectedRaw);
            let refLS1 = sensors.GetNormRefValCS(refRawLS1, B_REF_RAW_LS1, W_REF_RAW_LS1);
            let refLS2 = sensors.GetNormRefValCS(refRawLS2, B_REF_RAW_LS2, W_REF_RAW_LS2);
            let refLS3 = sensors.GetNormRefValCS(refRawLS3, B_REF_RAW_LS3, W_REF_RAW_LS3);
            let refLS4 = sensors.GetNormRefValCS(refRawLS4, B_REF_RAW_LS4, W_REF_RAW_LS4);
            let error = (refLS2 - refLS3) + (refRawLS1 - refRawLS4) * lineFollow4SensorSideSensCoef; // Ошибка регулирования
            automation.pid1.setPoint(error); // Передать ошибку регулятору
            let U = 0;
            if (refRawLS1 > LINE_REF_TRESHOLD) {
                control.timer1.reset();
                lastSensor = 1;
            } else if (refRawLS2 > LINE_REF_TRESHOLD || refRawLS3 > LINE_REF_TRESHOLD) {
                control.timer1.reset();
                lastSensor = 2;
            } else if (refRawLS4 > LINE_REF_TRESHOLD) {
                control.timer1.reset();
                lastSensor = 3;
            } else if (control.timer1.millis() > 100) {
                U = (2 - lastSensor) * lineFollow4SensorSpeed;
            } else {
                U = automation.pid1.compute(dt, 0); // Управляющее воздействие
            }
            //CHASSIS_MOTORS.steer(U, lineFollow4SensorSpeed); // Команда моторам
            chassis.ChassisControl(U, lineFollow4SensorSpeed);
            if (debug) {
                brick.clearScreen(); // Очистка экрана
                brick.printValue("refLS1", refLS1, 1);
                brick.printValue("refLS2", refLS2, 2);
                brick.printValue("refLS3", refLS3, 3);
                brick.printValue("refLS4", refLS4, 4);
                brick.printValue("error", error, 5);
                brick.printValue("U", U, 6);
                brick.printValue("dt", dt, 12);
            }
            control.pauseUntilTime(currTime, 2); // Ожидание выполнения цикла
        }
        music.playToneInBackground(262, 300); // Издаём сигнал завершения
        chassis.ActionAfterMotion(lineFollow4SensorSpeed, AfterMotion.Rolling); // Действие после алгоритма движения
    }

    /**
     * Функция движения по линии до перекрёстка.
     * @param actionAfterMotion действие после перекрёстка, eg: AfterMotion.Rolling
     * @param debug отладка, eg: false
     */
    //% blockId="LineFollowToIntersection"
    //% block="движение по линии до перекрёстка с действием после $actionAfterMotion||параметры = $params| отладка $debug"
    //% inlineInputMode="inline"
    //% expandableArgumentMode="enabled"
    //% debug.shadow="toggleOnOff"
    //% params.shadow="SetEmptyParams"
    //% weight="99"
    //% group="Движение по линии"
    export function LineFollowToIntersection(actionAfterMotion: AfterMotion, params?: automation.LineFollowInterface, debug: boolean = false) {
        if (params) { // Если были переданы параметры
            if (params.speed) lineFollow4SensorSpeed = Math.abs(params.speed);
            if (params.Kp) lineFollow4SensorKp = params.Kp;
            if (params.Ki) lineFollow4SensorKi = params.Ki;
            if (params.Kd) lineFollow4SensorKd = params.Kd;
            if (params.N) lineFollow4SensorN = params.N;
        }

        automation.pid1.setGains(lineFollow4SensorKp, lineFollow4SensorKi, lineFollow4SensorKd); // Установка коэффицентов  ПИД регулятора
        automation.pid1.setDerivativeFilter(lineFollow4SensorN); // Установить фильтр дифференциального регулятора
        automation.pid1.setControlSaturation(-200, 200); // Установка интервала ПИД регулятора
        automation.pid1.reset(); // Сброс ПИД регулятора
        
        let prevTime = 0; // Переменная предыдущего времения для цикла регулирования
        while (true) { // Цикл регулирования движения по линии
            let currTime = control.millis(); // Текущее время
            let dt = currTime - prevTime; // Время за которое выполнился цикл
            prevTime = currTime; // Новое время в переменную предыдущего времени
            let refRawLS1 = LIGHT_SEN_1.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS2 = LIGHT_SEN_2.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS3 = LIGHT_SEN_3.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS4 = LIGHT_SEN_4.light(NXTLightIntensityMode.ReflectedRaw);
            let refLS1 = sensors.GetNormRefValCS(refRawLS1, B_REF_RAW_LS1, W_REF_RAW_LS1);
            let refLS2 = sensors.GetNormRefValCS(refRawLS2, B_REF_RAW_LS2, W_REF_RAW_LS2);
            let refLS3 = sensors.GetNormRefValCS(refRawLS3, B_REF_RAW_LS3, W_REF_RAW_LS3);
            let refLS4 = sensors.GetNormRefValCS(refRawLS4, B_REF_RAW_LS4, W_REF_RAW_LS4);
            if (refLS2 < LW_TRESHOLD && refLS3 < LW_TRESHOLD) break; // Проверка на перекрёсток
            let error = (lineFollow4SensorSideSensCoef * refLS1 + refLS2) - (refLS3 + refLS4 * lineFollow4SensorSideSensCoef); // Ошибка регулирования
            automation.pid1.setPoint(error); // Передать ошибку регулятору
            let U = automation.pid1.compute(dt, 0); // Управляющее воздействие
            //CHASSIS_MOTORS.steer(U, lineFollow4SensorSpeed); // Команда моторам
            chassis.ChassisControl(U, lineFollow4SensorSpeed);
            if (debug) {
                brick.clearScreen(); // Очистка экрана
                brick.printValue("refLS1", refLS1, 1);
                brick.printValue("refLS2", refLS2, 2);
                brick.printValue("refLS3", refLS3, 3);
                brick.printValue("refLS4", refLS4, 4);
                brick.printValue("error", error, 5);
                brick.printValue("U", U, 6);
                brick.printValue("dt", dt, 12);
            }
            control.pauseUntilTime(currTime, 2); // Ожидание выполнения цикла
        }
        music.playToneInBackground(262, 300); // Издаём сигнал завершения
        chassis.ActionAfterMotion(lineFollow4SensorSpeed, actionAfterMotion); // Действие после алгоритма движения
    }

    /**
     * Движение по линии на расстояние. Очень грубый метод.
     * @param dist скорость движения, eg: 250
     * @param speed скорость движения, eg: 60
     * @param actionAfterMotion действие после перекрёстка, eg: AfterMotion.Rolling
     * @param debug отладка, eg: false
     */
    //% blockId="LineFollowToDistance"
    //% block="движение по линии на расстояние $dist|мм с действием после $actionAfterMotion||параметры = $params| отладка $debug"
    //% inlineInputMode="inline"
    //% expandableArgumentMode="toggle"
    //% debug.shadow="toggleOnOff"
    //% params.shadow="SetEmptyParams"
    //% weight="98"
    //% group="Движение по линии"
    export function LineFollowToDistance(dist: number, actionAfterMotion: AfterMotion, params?: automation.LineFollowInterface, debug: boolean = false) {
        if (params) { // Если были переданы параметры
            if (params.speed) lineFollow4SensorSpeed = Math.abs(params.speed);
            if (params.Kp) lineFollow4SensorKp = params.Kp;
            if (params.Ki) lineFollow4SensorKi = params.Ki;
            if (params.Kd) lineFollow4SensorKd = params.Kd;
            if (params.N) lineFollow4SensorN = params.N;
        }

        let lMotEncPrev = CHASSIS_L_MOTOR.angle(), rMotEncPrev = CHASSIS_R_MOTOR.angle(); // Значения с энкодеров моторов до запуска
        let calcMotRot = (dist / (Math.PI * WHEELS_D)) * 360; // Дистанция в мм, которую нужно проехать по линии

        automation.pid1.setGains(lineFollow4SensorKp, lineFollow4SensorKi, lineFollow4SensorKd); // Установка коэффицентов  ПИД регулятора
        automation.pid1.setDerivativeFilter(lineFollow4SensorN); // Установить фильтр дифференциального регулятора
        automation.pid1.setControlSaturation(-200, 200); // Установка интервала ПИД регулятора
        automation.pid1.reset(); // Сброс ПИД регулятора

        let prevTime = 0; // Переменная предыдущего времения для цикла регулирования
        while (true) { // Пока моторы не достигнули градусов вращения
            let currTime = control.millis(); // Текущее время
            let dt = currTime - prevTime; // Время за которое выполнился цикл
            prevTime = currTime; // Новое время в переменную предыдущего времени
            let lMotEnc = CHASSIS_L_MOTOR.angle(), rMotEnc = CHASSIS_R_MOTOR.angle(); // Значения с энкодеров моторы
            if (Math.abs(lMotEnc - lMotEncPrev) >= Math.abs(calcMotRot) || Math.abs(rMotEnc - rMotEncPrev) >= Math.abs(calcMotRot)) break;
            let refRawLS1 = LIGHT_SEN_1.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS2 = LIGHT_SEN_2.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS3 = LIGHT_SEN_3.light(NXTLightIntensityMode.ReflectedRaw);
            let refRawLS4 = LIGHT_SEN_4.light(NXTLightIntensityMode.ReflectedRaw);
            let refLS1 = sensors.GetNormRefValCS(refRawLS1, B_REF_RAW_LS1, W_REF_RAW_LS1);
            let refLS2 = sensors.GetNormRefValCS(refRawLS2, B_REF_RAW_LS2, W_REF_RAW_LS2);
            let refLS3 = sensors.GetNormRefValCS(refRawLS3, B_REF_RAW_LS3, W_REF_RAW_LS3);
            let refLS4 = sensors.GetNormRefValCS(refRawLS4, B_REF_RAW_LS4, W_REF_RAW_LS4);
            let error = refLS2 - refLS3; // Ошибка регулирования
            automation.pid1.setPoint(error); // Передать ошибку регулятору
            let U = automation.pid1.compute(dt, 0); // Управляющее воздействие
            //CHASSIS_MOTORS.steer(U, lineFollow4SensorSpeed); // Команда моторам
            chassis.ChassisControl(U, lineFollow4SensorSpeed);
            if (debug) {
                brick.clearScreen(); // Очистка экрана
                brick.printValue("refLS1", refLS1, 1);
                brick.printValue("refLS2", refLS2, 2);
                brick.printValue("refLS3", refLS3, 3);
                brick.printValue("refLS4", refLS4, 4);
                brick.printValue("error", error, 5);
                brick.printValue("U", U, 6);
                brick.printValue("dt", dt, 12);
            }
            control.pauseUntilTime(currTime, 2); // Ожидание выполнения цикла
        }
        music.playToneInBackground(262, 300); // Издаём сигнал завершения
        chassis.ActionAfterMotion(lineFollow4SensorSpeed, actionAfterMotion); // Действие после алгоритма движения
    }

}