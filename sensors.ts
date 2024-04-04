namespace sensors {

    /**
     * Функция для программной калибровки и нормализации сырых значений с датчика.
     * @param refRawValCS текущее сырое значение отражения, eg: 0
     * @param bRefRawValCS сырое значение отражения на чёрном, eg: 500
     * @param wRefRawValCS сырое значение отражения на белом, eg: 650
     */
    //% blockId="GetNormRefValCS"
    //% block="нормализовать знач-е отраж-я $refRawValCS|при чёрном $bRefRawValCS|и белом $wRefRawValCS"
    //% inlineInputMode="inline"
    //% weight="68" blockGap="8"
    //% group="Color Sensor"
    export function GetNormRefValCS(refRawValCS: number, bRefRawValCS: number, wRefRawValCS: number): number {
        let refValCS = Math.map(refRawValCS, bRefRawValCS, wRefRawValCS, 0, 100);
        refValCS = Math.constrain(refValCS, 0, 100);
        return refValCS;
    }

}