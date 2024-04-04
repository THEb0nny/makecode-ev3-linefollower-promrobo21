namespace chassis {

    /**
     * Управление моторами шасси.
     * @param dir направление поворота, eg: 0
     * @param speed скорость движения, eg: 80
     */
    //% blockId="ChassisControl"
    //% block="движение по направлению $dir| на $speed|\\%"
    //% inlineInputMode="inline"
    //% dir.shadow="motorTurnRatioPicker"
    //% dir.min="-100" dir.max="100"
    //% speed.shadow="motorSpeedPicker"
    //% weight="2"
    //% group="Move"
    export function ChassisControl(dir: number, speed: number) {
        let mB = speed + dir, mC = speed - dir;
        let z = speed / Math.max(Math.abs(mB), Math.abs(mC));
        mB *= z; mC *= z;
        CHASSIS_L_MOTOR.run(mB); CHASSIS_R_MOTOR.run(mC);
    }

    /**
     * Остановить моторы шасси.
     * @param setBreak жёсткое торможение или торможение по инерции, eg: true
     */
    //% blockId="ChassisStop"
    //% block="остановить моторы жёсткий тормоз $setBreak"
    //% inlineInputMode="inline"
    //% setBreak.shadow="toggleOnOff"
    //% weight="1"
    //% group="Move"
    export function ChassisStop(setBreak: boolean) {
        CHASSIS_L_MOTOR.setPauseOnRun(false); CHASSIS_R_MOTOR.setPauseOnRun(false); // Отключаем у моторов ожидание выполнения
        CHASSIS_L_MOTOR.setBrake(setBreak); CHASSIS_R_MOTOR.setBrake(setBreak);
        CHASSIS_L_MOTOR.stop(); CHASSIS_R_MOTOR.stop();
        CHASSIS_L_MOTOR.setPauseOnRun(true); CHASSIS_R_MOTOR.setPauseOnRun(true); // Включаем обратно у моторов ожидание выполнения ???
    }

    // Функция, которая выполняет действие после цикла с движением
    export function ActionAfterMotion(speed: number, actionAfterMotion: AfterMotion | AfterMotionShort) {
        if (actionAfterMotion == AfterMotion.Rolling) { // Прокатка после определния перекрёстка
            chassis.DistMove(DIST_ROLLING_AFTER_INTERSECTION, speed, true);
        } else if (actionAfterMotion == AfterMotion.DecelRolling) { // Прокатка с мягким торможением после определния перекрёстка
            chassis.RampDistMove(DIST_ROLLING_AFTER_INTERSECTION, 0, DIST_ROLLING_AFTER_INTERSECTION / 2, speed);
        } else if (actionAfterMotion == AfterMotion.RollingNoStop) { // Команда прокатка на расстояние, но без торможения, нужна для съезда с перекрёстка
            chassis.RollingMoveOut(DIST_ROLLING_MOVE_OUT, speed);
        } else if (actionAfterMotion == AfterMotion.BreakStop) { // Тормоз с жёстким торможением
            // CHASSIS_MOTORS.setBrake(true);
            // CHASSIS_MOTORS.stop();
            chassis.ChassisStop(true);
        } else if (actionAfterMotion == AfterMotion.NoBreakStop) { // Тормоз с прокаткой по инерции
            // CHASSIS_MOTORS.setBrake(false);
            // CHASSIS_MOTORS.stop();
            chassis.ChassisStop(false);
        } else if (actionAfterMotion == AfterMotion.NoStop) { // NoStop не подаётся команда на торможение, а просто вперёд, например для перехвата следующей функцией управления моторами
            // CHASSIS_MOTORS.steer(0, speed);
            chassis.ChassisControl(0, speed);
        }
    }

    // Вспомогательная функция для типа торможения движения на расстоние без торможения. Например, для съезда с линии, чтобы её не считал алгоритм движения по линии.
    export function RollingMoveOut(dist: number, speed: number) {
        if (dist == 0 || speed == 0) {
            //CHASSIS_MOTORS.stop();
            ChassisStop(true);
            return;
        }
        let lMotEncPrev = CHASSIS_L_MOTOR.angle(), rMotEncPrev = CHASSIS_R_MOTOR.angle(); // Значения с энкодеров моторов до запуска
        let calcMotRot = (dist / (Math.PI * WHEELS_D)) * 360; // Дистанция в мм, которую нужно пройти
        //CHASSIS_MOTORS.steer(0, speed); // Команда вперёд
        ChassisControl(0, speed);

        let prevTime = 0; // Переменная предыдущего времения для цикла регулирования
        while (true) { // Пока моторы не достигнули градусов вращения
            let currTime = control.millis(); // Текущее время
            let dt = currTime - prevTime; // Время за которое выполнился цикл
            prevTime = currTime; // Новое время в переменную предыдущего времени
            let lMotEnc = CHASSIS_L_MOTOR.angle(), rMotEnc = CHASSIS_R_MOTOR.angle(); // Значения с энкодеров моторы
            if (Math.abs(lMotEnc - lMotEncPrev) >= Math.abs(calcMotRot) || Math.abs(rMotEnc - rMotEncPrev) >= Math.abs(calcMotRot)) break;
            control.pauseUntilTime(currTime, 10); // Ожидание выполнения цикла
        }
        // Команды для остановки не нужно, в этом и смысл функции
    }

    /**
     * Движение на расстояние в мм.
     * @param dist дистанция движения в мм, eg: 100
     * @param speed скорость движения, eg: 60
     * @param setBreak тип торможения, с удержанием позиции при истине, eg: true
     */
    //% blockId="DistMove"
    //% block="движение на расстояние $dist|на $speed|\\% жёсткий тормоз $setBreak"
    //% inlineInputMode="inline"
    //% speed.shadow="motorSpeedPicker"
    //% setBreak.shadow="toggleOnOff"
    //% weight="3"
    //% group="Move"
    export function DistMove(dist: number, speed: number, setBreak: boolean = true) {
        if (dist == 0 || speed == 0) {
            //CHASSIS_MOTORS.stop();
            ChassisStop(true);
            return;
        }
        // CHASSIS_MOTORS.setBrake(setBreak); // Удерживать при тормозе
        // let mRotCalc = (dist / (Math.PI * WHEELS_D)) * 360; // Подсчёт по формуле
        // CHASSIS_MOTORS.tank(speed, speed, mRotCalc, MoveUnit.Degrees); // Передаём команду моторам
        const mRotCalc = (dist / (Math.PI * WHEELS_D)) * 360; // Расчёт угла поворота на дистанцию
        CHASSIS_L_MOTOR.setBrake(setBreak); CHASSIS_R_MOTOR.setBrake(setBreak); // Установить жёсткий тип торможения
        CHASSIS_L_MOTOR.setPauseOnRun(false); CHASSIS_R_MOTOR.setPauseOnRun(false); // Отключаем у моторов ожидание выполнения
        CHASSIS_L_MOTOR.run(speed, mRotCalc, MoveUnit.Degrees); CHASSIS_R_MOTOR.run(speed, mRotCalc, MoveUnit.Degrees); // Передаём команды движения на моторы
        CHASSIS_L_MOTOR.pauseUntilReady(); CHASSIS_R_MOTOR.pauseUntilReady(); // Ждём выполнения моторами команды
        CHASSIS_L_MOTOR.setPauseOnRun(true); CHASSIS_R_MOTOR.setPauseOnRun(true); // Включаем обратно у моторов ожидание выполнения ???
    }

    /**
     * Движение на заданное расстояние с ускорением и замедлением в мм.
     * @param totalDist общее расстояние в мм, eg: 150
     * @param accelDist расстояние ускорения в мм, eg: 100
     * @param decelDist расстояние замедления в мм, eg: 100
     * @param speed скорость движения, eg: 60
     */
    //% blockId="RampDistMove"
    //% block="движение на расстояние $totalDist|c расстоянием ускорения $accelDist| замедления $decelDist| со скоростью $speed|\\%"
    //% inlineInputMode="inline"
    //% speed.shadow="motorSpeedPicker"
    //% weight="4"
    //% group="Move"
    export function RampDistMove(totalDist: number, accelDist: number, decelDist: number, speed: number) {
        CHASSIS_L_MOTOR.setBrake(true); CHASSIS_R_MOTOR.setBrake(true); // Установить торможение с удержанием
        let mRotAccelCalc = (accelDist == 0 ? 0 : Math.round((accelDist / (Math.PI * WHEELS_D)) * 360)); // Расчитываем расстояние ускорения
        let mRotDecelCalc = (decelDist == 0 ? 0 : Math.round((decelDist / (Math.PI * WHEELS_D)) * 360)); // Расчитываем расстояние замедления
        let mRotNormCalc = Math.round((totalDist / (Math.PI * WHEELS_D)) * 360) - mRotAccelCalc - mRotDecelCalc; // Рассчитываем общюю дистанцию
        CHASSIS_L_MOTOR.setPauseOnRun(false); CHASSIS_R_MOTOR.setPauseOnRun(false); // Отключаем у моторов ожидание выполнения
        // Передаём команды движения на моторы
        CHASSIS_L_MOTOR.ramp(speed, mRotNormCalc, MoveUnit.Degrees, mRotAccelCalc, mRotDecelCalc);
        CHASSIS_R_MOTOR.ramp(speed, mRotNormCalc, MoveUnit.Degrees, mRotAccelCalc, mRotDecelCalc);
        CHASSIS_L_MOTOR.pauseUntilReady(); CHASSIS_R_MOTOR.pauseUntilReady(); // Ждём выполнения моторами команды
        CHASSIS_L_MOTOR.setPauseOnRun(true); CHASSIS_R_MOTOR.setPauseOnRun(true); // Включаем обратно у моторов ожидание выполнения ???
    }

}