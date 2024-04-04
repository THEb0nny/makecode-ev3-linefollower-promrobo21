namespace custom {

    /**
     * Настройка параметров функций.
     * @param startupScreen экран при старте, eg: 0
     */
    //% blockId="FunctionsTune"
    //% block="проверка функций|| с начальным экраном %screen"
    //% expandableArgumentMode="toggle"
    //% weight="99"
    //% group="Дополнительно"
    export function FunctionsTune(startupScreen: number = 0, debug: boolean = false) {
        const LOOP_DELAY = 10; // Задержка цикла
        const LINE_SCROLL_TRESHOLD = 5; // Начинать скролл параметров с строки
        const BTN_PRESS_LOOP_DELAY = 150; // Задержка в цикле при нажатии
        const REG_COEFFICIENT_STEP_NAMES: string[] = ["Kp_step", "Ki_step", "Kd_step", "N_step"];

        let paramIncrease = false, paramDecrease = false; // Переменные состояния кнопок/влево вправо при изменении параметров
    
        // Пользовательские значения
        let methodScreens: { [key: string]: { params: { [key: string]: { [key: string]: number } }, hrStrings: number[] } } = {
            LW_4S: {
                params: {
                    speed: { 
                        val: motions.lineFollow4SensorSpeed,
                        changeStep: 5,
                        min: 5,
                        max: 100
                    },
                    Kp: {
                       val: motions.lineFollow4SensorKp,
                       changeStep: 0.05
                    },
                    Ki: {
                        val: motions.lineFollow4SensorKi,
                        changeStep: 0.001
                    },
                    Kd: {
                        val: motions.lineFollow4SensorKd,
                        changeStep: 0.1
                    },
                    N: {
                        val: motions.lineFollow4SensorN,
                        changeStep: 0.1
                    },
                    C: {
                        val: motions.lineFollow4SensorSideSensCoef,
                        changeStep: 0.1
                    }
                },
                hrStrings: [1, 4]
            }
        }

        const screensNums = Object.keys(methodScreens).length; // Количество экранов с регуляторами

        let screen = Math.constrain(startupScreen, 0, screensNums - 1);
        let cursor = 0; // Крусор (выделенная строка)
        let confirm = false; // Подтвержден ли курсор (строка) или нет
        let scroll = 0; // Переменная хранение числа скролла
        let screenChanged = false; // Переменная о смене экрана

        // Защита от бага, что запуск функции по кнопке смещает курсор
        // pauseUntil(() => brick.buttonUp.wasPressed() || brick.buttonDown.wasPressed() || brick.buttonLeft.wasPressed() || brick.buttonRight.wasPressed() || brick.buttonEnter.wasPressed());
        // if (debug) console.log("cursor: " + cursor + ", PARAMS_VALUES[" + screen + "][" + (cursor - 1) + "]: " + PARAMS_VALUES[screen][cursor - 1]);
        
        // Цикл обработки интерфейса
        while (true) {
            brick.clearScreen(); // Очищаем экран
            // console.log(`cursor: ${cursor}`);
            // console.log(`scroll: ${scroll}`);
            const screenName = Object.keys(methodScreens)[screen];
            // console.log(`screenName: ${screenName}`);
            const screenParamsNum = Object.keys(methodScreens[screenName].params).length; // Количество параметров
            const totalStrNum = screenParamsNum + REG_COEFFICIENT_STEP_NAMES.length + 2; // Общее количество кликабельных строк c параметрами
            // console.log(`totalStrNum: ${totalStrNum}`);
            // if (debug) console.log(`screenParamsNum: ${screenParamsNum}`);
            if (screenChanged) { // Экран на прошлой итеррации цикла был изменён?
                if (cursor > totalStrNum) cursor = totalStrNum; // Если позиция курсора была дальше, чем общее количество строк, тогда курсор ставим на последнюю строку
                screenChanged = false;
            }
            brick.printString(`${screen + 1}) ${screenName}`, 1); // Шапка выводится всегда
            brick.showString("=============================", 2);
            let strPrint = 3; // Строка печати
            if (strPrint - scroll > 2) brick.showString(`${cursor == 0 ? "> " : ""} RUN TEST`, strPrint - scroll);
            strPrint++;
            if (strPrint - scroll > 2) brick.showString("-----------------------------", strPrint - scroll);
            strPrint++;
            //console.log(`strPrint: ${strPrint}, scroll: ${scroll}`);

            const hrArr = methodScreens[screenName].hrStrings; // Массив разделителей
            for (let i = 0; i < screenParamsNum; i++) {
                if (hrArr.indexOf(i) != -1 && strPrint - scroll > 2) { // Проверяем совпадает ли индекс со строкой в массиве разделителей
                    brick.showString("-----------------------------", strPrint - scroll);
                    strPrint++;
                }
                if (strPrint - scroll > 2) {
                    const paramName = Object.keys(methodScreens[screenName].params)[i];
                    const paramValue = methodScreens[screenName].params[paramName].val;
                    //console.log(`paramName: ${paramName}, paramValue: ${paramValue}`);
                    brick.showValue(`${cursor == i + 1 ? (confirm ? ">>> " : "> ") : ""} ${paramName}`, paramValue, strPrint - scroll);
                }
                strPrint++;
            }

            if (strPrint - scroll > 2) {
                brick.showString("-----------------------------", strPrint - scroll);
                strPrint++;
            }
            if (strPrint - scroll > 2) {
                brick.showString(`${cursor == screenParamsNum + 1 ? "> " : ""} RUN TEST`, strPrint - scroll);
                strPrint++;
            }
            if (strPrint - scroll > 2) {
                brick.showString("-----------------------------", strPrint - scroll);
                strPrint++;
            }

            // Печать параметров шагов
            for (let i = 0; i < REG_COEFFICIENT_STEP_NAMES.length; i++) {
                if (strPrint - scroll > 2) {
                    const paramName = Object.keys(methodScreens[screenName].params)[i + 1];
                    let changeStep = methodScreens[screenName].params[paramName].changeStep;
                    changeStep = (changeStep != undefined ? changeStep : 1);
                    brick.showValue(`${cursor == i + screenParamsNum + 2 ? (confirm ? ">>> " : "> ") : ""} ${REG_COEFFICIENT_STEP_NAMES[i]}`, changeStep, strPrint - scroll);
                    strPrint++;
                }
            }

            // Если активно изменение
            if (confirm) {
                // Фиксируем о необходимости изменить параметр
                if (brick.buttonLeft.isPressed()) paramDecrease = true; // Нажатие влево - уменьшаем число
                else if (brick.buttonRight.isPressed()) paramIncrease = true; // Нажатие вправо - увеличиваем число
                else paramDecrease = false, paramIncrease = false; // Если нажатий нет
                if (paramDecrease || paramIncrease) { // Изменяем коэффициент
                    const paramName = Object.keys(methodScreens[screenName].params)[cursor - 1];
                    console.log(`paramName: ${paramName}`);
                    if (paramName != undefined) {
                        let changeStep = methodScreens[screenName].params[paramName].changeStep;
                        console.log(`changeStep: ${changeStep}`);
                        changeStep = (changeStep != undefined ? changeStep : 0.01);

                        let minLimit = methodScreens[screenName].params[paramName].min;
                        minLimit = (minLimit != undefined ? minLimit : 0);
                        let maxLimit = methodScreens[screenName].params[paramName].max;
                        maxLimit = (maxLimit != undefined ? maxLimit : 1000);

                        if (paramDecrease) methodScreens[screenName].params[paramName].val -= changeStep;
                        else if (paramIncrease) methodScreens[screenName].params[paramName].val += changeStep;
                        methodScreens[screenName].params[paramName].val = Math.constrain(methodScreens[screenName].params[paramName].val, minLimit, maxLimit);
                    } else { // Параметры шагов
                        if (cursor == screenParamsNum + 2) { // Kp_step
                            methodScreens[screenName].params.changeStepPID.Kp = 0;
                            let changeStep = methodScreens[screenName].params.changeStepPID.Kp;
                            if (changeStep == undefined) {
                                methodScreens[screenName].params.changeStepPID.Kp = 0.01;
                                changeStep = methodScreens[screenName].params.changeStepPID.Kp;
                            }
                            if (paramDecrease) methodScreens[screenName].params.Kp.changeStepPID -= 0.01;
                            else if (paramIncrease) methodScreens[screenName].params.Kp.changeStepPID += 0.01;
                            methodScreens[screenName].params[paramName].changeStepPID = Math.constrain(methodScreens[screenName].params[paramName].changeStepPID, 0.0001, 1);
                        }
                    }
                    
                    loops.pause(BTN_PRESS_LOOP_DELAY);
                    continue;
                }
            } else { // Если изменение не активно
                if (brick.buttonLeft.wasPressed() && control.timer1.millis() >= 100) {
                    screenChanged = true;
                    if (screen > 0) screen--;
                    else screen = screensNums - 1;
                    music.playToneInBackground(Note.C, 50); // Сигнал о переключении экрана
                } else if (brick.buttonRight.wasPressed() && control.timer1.millis() >= 100) {
                    screenChanged = true;
                    if (screen < screensNums - 1) screen++;
                    else screen = 0;
                    music.playToneInBackground(Note.C, 50); // Сигнал о переключении экрана
                }
            }

            // Обрабатываем нажатия
            if (brick.buttonUp.wasPressed()) { // Если нажали кнопку вверх
                if (confirm) { // Если изменение было активно
                    confirm = !confirm; // Отключаем подтверждение изменения, если изменение было активно
                    music.playToneInBackground(Note.F, 50); // Сигнал
                }
                if (cursor > 0) { // Изменить курсор, если значение больше первой строке с числом на экране
                    cursor--;
                    if (cursor >= LINE_SCROLL_TRESHOLD) scroll--;
                    else scroll = 0;
                } else { // Иначе ставим курсор в конец и устанавливаем скролл на последнюю строку
                    cursor = totalStrNum - 1;
                    scroll = screenParamsNum + 1;
                }
            } else if (brick.buttonDown.wasPressed()) { // Если нажали кнопку вниз
                if (confirm) { // Если изменение было активно
                    confirm = !confirm; // Отключаем подтверждение изменения, если изменение было активно
                    music.playToneInBackground(Note.F, 50); // Сигнал
                }
                if (cursor < totalStrNum - 1) { // Изменить курсор, если значение меньше количеству строк с значениями на экране
                    cursor++;
                    if (cursor >= LINE_SCROLL_TRESHOLD) scroll++;
                    else scroll = 0;
                } else { // Иначе ставим курсор в начало и убираем скролл
                    cursor = 0;
                    scroll = 0;
                }
            }

            // Обрабатываем нажатие ENTER
            if (brick.buttonEnter.wasPressed()) {
                if (cursor == 0 || cursor == screenParamsNum + 1) { // Нажали на строку RUN TEST?
                    music.playToneInBackground(Note.D, 100); // Сигнал, что было запущено
                    // Запускаем выполнение теста
                    if (screen == 0) {
                        const params = {
                            speed: methodScreens.LW_4S.params.speed.val,
                            Kp: methodScreens.LW_4S.params.Kp.val,
                            Ki: methodScreens.LW_4S.params.Ki.val,
                            Kd: methodScreens.LW_4S.params.Kd.val,
                            N: methodScreens.LW_4S.params.N.val,
                            C: methodScreens.LW_4S.params.C.val
                        };
                        motions.LineFollowToIntersection(AfterMotion.BreakStop, params, true);
                    }
                } else { // Если нажали на обычную строку с параметром, то подтверждаем для возможности его изменения
                    music.playToneInBackground(Note.F, 50); // Сигнал
                    if (confirm) control.timer1.reset(); // Костыль от переключения экрана после изменения коэффициента и применения
                    confirm = !confirm; // Измение состояния выбора
                    continue;
                }
            }

            loops.pause(LOOP_DELAY);
        }
    }
}