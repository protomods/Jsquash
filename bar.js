/**
 * Timer bar behavior
 * @constructor
 */
Bar = function()
{
    this.name = 'Bar';
    var self = this;

    var offset;
    var size;
    var backgroundColor;
    var foregroundColor;
    var layerId;
    var reverse;
    var percentage;
    var backgroundSprite;
    var foregroundSprite;
    var spriteIndex;
    var useGradient;
    var marker;
    var markerLayer;
    var text;
    var initialTime;
    var timer;
    var second = 0;

    /**
     * Used to setup timer bar
     * @param {object} [parameters.bar] This is an array of parameters used to setup the timer bar
     * timer: the time to start the full timer at {number}
     * offset: offset the timer {x:number, y:number}
     * size: size of the timer {x:number, y:number}
     * backColor: the colour to use behind the timer {string}
     * foreColor: the colour to fill the timer with {string}
     * layerId: the layer to draw the timer on {number}
     * reverse: not implemented, dont mess with it
     * spriteIndex:
     * useGradient: gradiant to fill the bar up with , an array of colours [{string}...]
     * marker: image to use for the marker on the end of the timer {string}
     * markerLayer: layer to draw the marker on {number}
     */
    this.init = function(parameters)
    {

        timer = (parameters && parameters.bar && parameters.bar.timer) || 60;
        initialTime = timer;
        offset = (parameters && parameters.bar && parameters.bar.offset) || {x:0, y:0};
        size = (parameters && parameters.bar && parameters.bar.size) || {x:200, y:40};
        backgroundColor = (parameters && parameters.bar && parameters.bar.backColor) || '#101010';
        foregroundColor = (parameters && parameters.bar && parameters.bar.foreColor) || '#FF0000';
        layerId = (parameters && parameters.bar && parameters.bar.layer) || 1;
        reverse = (parameters && parameters.bar && parameters.bar.reverse) || false;
        spriteIndex = (parameters && parameters.bar && parameters.bar.spriteIndex) || 0;
        useGradient = (parameters && parameters.bar && parameters.bar.useGradient) || '#000000';
        marker = (parameters && parameters.bar && parameters.bar.marker) || null;
        markerLayer = (parameters && parameters.bar && parameters.bar.markerLayer) || 1;

        percentage = reverse ? 100 : 0; // Percentage filled based on direction

        // Create the sprites
        backgroundSprite = new Sprite(null, layerId);
        backgroundSprite.setDrawFunction(wade.drawFunctions.solidFill_(backgroundColor));
        backgroundSprite.setSize(size.x, size.y);
        foregroundSprite = new Sprite(null, layerId);
        if(useGradient && Array.isArray(foregroundColor))
        {
            foregroundSprite.setDrawFunction(wade.drawFunctions.gradientFill_({x:-1, y:0},foregroundColor));
        }
        else if(!Array.isArray(foregroundColor))
        {
            foregroundSprite.setDrawFunction(wade.drawFunctions.gradientFill_({x:-1, y:0},[foregroundColor, '#000000']));
        }
        else
        {
            foregroundSprite.setDrawFunction(wade.drawFunctions.solidFill_(foregroundColor));
        }

        if(reverse)
        {
            foregroundSprite.setSize(size.x, size.y);
        }
        else
        {
            foregroundSprite.setSize(50, size.y);
        }

        // Create marker sprite
        marker = new Sprite(marker, markerLayer);
        text = new TextSprite(wade.app.getTimeString(timer),'27px Monopower', 'white', 'center', markerLayer);

        // Add sprites to scene
        this.owner.addSprite(backgroundSprite, offset);
        this.owner.addSprite(foregroundSprite, offset);
        this.owner.addSprite(marker, {x:offset.x - backgroundSprite.getSize().x/2 + foregroundSprite.getSize().x - marker.getSize().x/2 , y:offset.y});
        this.owner.addSprite(text,{x:offset.x - backgroundSprite.getSize().x/2 + foregroundSprite.getSize().x - marker.getSize().x/2, y:offset.y+7});
        // Hack to make it work on 1 layer so I only need 1 layer not using gl
        this.owner.getSprite(0).bringToFront();
        marker.bringToFront();
        text.bringToFront();

    };

    this.onUpdate = function()
    {
        if(timer > 0)
        {
          timer -= wade.c_timeStep;
          second += wade.c_timeStep;
        }

        else
        {
            wade.app.gameOver = true; // This is horrible
        }

        if(Math.floor(timer) <= 9)
        {
           text.setColor('red');
        }

        else
        {
            text.setColor('white');
        }


        if(second >=1) // Only update text every second for performance
        {
            second = 0;
            text.setText(wade.app.getTimeString(Math.floor(timer)));
        }

        percentage = timer/initialTime*100;
        if(percentage <0)
        {
            percentage = 0;
        }
        foregroundSprite.setSize(size.x/100*percentage, size.y);
        this.owner.setSpriteOffset(spriteIndex+1, {x:offset.x-(backgroundSprite.getSize().x-foregroundSprite.getSize().x)/2, y:offset.y});
        this.owner.setSpriteOffset(spriteIndex+2, {x:offset.x-backgroundSprite.getSize().x/2 + foregroundSprite.getSize().x + ((0.5-percentage/100)*marker.getSize().x), y:offset.y});
        this.owner.setSpriteOffset(spriteIndex+3, {x:offset.x-backgroundSprite.getSize().x/2 + foregroundSprite.getSize().x + ((0.5-percentage/100)*marker.getSize().x), y:offset.y+7});
    };

    this.addTime = function(seconds)
    {
        timer += seconds;
        if(timer > initialTime)
        {
            initialTime = timer;
        }

        this.onUpdate();
    };


    this.onAddToScene = function(parameters)
    {
        //this.init(parameters);
    };


};

