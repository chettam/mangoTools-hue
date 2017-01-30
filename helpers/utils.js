/**
 * Created by jbblanc on 11/11/2016.
 */

module.exports ={
    /**
     * Format volor in HSV ( compatible with Mango Tools
     * @param hue  0 - 65536
     * @param sat  0 - 255
     * @param brigthness 0 -255
     */
    
    toHSV : function(hue,sat,bri){
        return 'hsv('+ Math.min(Math.round(hue / 65536 *360),360) +','+Math.min(Math.round(sat / 255 * 100),100)+','+Math.min(Math.round(bri / 255 *100),100)+')';
    },
    
    /**
    * convert HSV to Hue Format
     * * */
    toHSB : function(value){
        var hsv =  value.replace("hsv(", "").replace(")", "").split(',');
        return {
            hue : Math.min(Math.round(hsv[0] / 360 *65536),65536),
            sat : Math.min(Math.round(hsv[1] / 100 * 255),255),
            bri : Math.min(Math.round(hsv[2] / 100 *255),255)

        };
    }


};