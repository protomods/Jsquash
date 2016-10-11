function Counter()
{
    this.name = 'Counter';
    this.timeToNewValue = 800;
    this.value = this.targetValue = 0;
    this._spriteIndex = 0;
    this.lastSoundTime = 0;
    var currentSize = 42;
    var targetSize = 42;
    var currentFont = 'Monopower';

    this.addValue = function(value, callback)
    {
        this.setValue(this.targetValue + value, callback);
    };

    this.setValue = function(value, callback)
    {
        if (value != this.value)
        {
            this.value = this.targetValue;
            this.targetValue = value;
            var interval = this.timeToNewValue / Math.abs(this.value - value);
            this.timeResolution = Math.min(Math.max(interval, wade.c_timeStep * 1000), this.timeToNewValue);
            this.updateValue(this.timeResolution, callback)();
        }
        else
        {
            callback && callback();
        }
    };

    this.getValue = function()
    {
      return this.targetValue;
    };

    this.setValueInstantly = function(value)
    {
        this.value = value;
        this.targetValue = value;
        this.owner.getSprite(this._spriteIndex).setText(this.targetValue);
    };

    this.updateValue = function(elapsedTime, callback)
    {
        var that = this;
        return function()
        {
            if (elapsedTime > that.timeToNewValue - that.timeResolution)
            {
                that.owner.getSprite(that._spriteIndex).setText(that.targetValue);
                that.value = that.targetValue;
                callback && callback();
            }
            else
            {
                var value = Math.round(that.value + (that.targetValue - that.value) * elapsedTime / that.timeToNewValue);
                that.owner.getSprite(that._spriteIndex).setText(value);
                elapsedTime += that.timeResolution;
                that.updateTimer && clearTimeout(that.updateTimer);
                that.updateTimer = setTimeout(that.updateValue(elapsedTime, callback), that.timeResolution);
                currentSize = 42;
            }
            var time = (new Date()).getTime();
            if (that.soundFx && !wade.app.soundMuted && time - that.lastSoundTime > 60)
            {
                that.lastSoundTime = time;
                wade.playAudioIfAvailable(that.soundFx);
            }
        }
    };

    this.stop = function()
    {
        clearTimeout(this.updateTimer);
        if (this.targetValue)
        {
            this.owner.getSprite(this._spriteIndex).setText(this.targetValue);
            this.value = this.targetValue;
        }
    };

    this.setSpriteIndex = function(index)
    {
        this._spriteIndex = index;
    };

    this.onAddToScene = function()
    {
        var textSprite = this.owner.getSprite(this._spriteIndex);
        textSprite.originalDraw = textSprite.draw;
        textSprite.setDrawFunction(function(context)
        {
            if (currentSize != targetSize)
            {
                this.setFont(Math.floor(currentSize) + 'px ' +  currentFont);
                currentSize += (targetSize - currentSize) / Math.abs(targetSize - currentSize);
            }
            this.originalDraw(context);
        });
    };
}
//@ sourceURL=counter.js