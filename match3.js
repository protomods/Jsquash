// Created by Stephen Surtees (foxcode)

/**
 * A behavior to handle the logic of a typical match 3 game
 * @constructor
 */
Match3 = function()
{
    // Keep current context
    var self = this;

    // Match 3 properties
    this.numCells = {x:6, y:6};
    this.cellSize = {x:80, y:80};
    this.margin = 8;
    this.items = [{normal: ' ', special: ' ', probability: 0}];
    this.specialFive = ' ';
    this.matchSound = ' ';
    this.explosionSound = ' ';
    this.specialFiveSound = ' ';
    this.explosionAnimation = {};
    this.sparkleAnimation = {};
    this.splashAnimation = {};
    this.specialFourAnimation = {};
    this.specialFiveAnimation = {};
    this.itemLayer = 2;
    this.bottomLayer = 3;
    this.topLayer = 1;
    this.gravity = 1500;
    this.effectScale = 1.0;
    this.position = {x:0, y:0};
    this.glowSize = 8;

    /**
     * Called when parent object is added to scene, used to set match 3 parameters
     * @param {object}[parameters.match3] This is an array of parameters used to setup the match3 game
     * numCells: number of columns and rows to use {x:number, y:number}
     * cellSize: pixel dimension of individual square {x:number, y:number}
     * margin: the space between a square image and the cell border as given by cell size {number}
     * items: the array of items to include in the squares in the form {normal:string, special:string, probability:number, background:string(optional)}
     * specialFive: the image to use for the special five gem {string}
     * matchSound: sound effect to play when a standard match is made {string}
     * explosionSound: sound effect to play when a special 4 object is matched {string}
     * specialFiveSound: sound effect to play when a special five gem is matched {string}
     * explosionAnimation: details of effect to play on gems surrounding match 4 gem when it is matched {name:string, numCellsX:number, numCellsY:number, speed:number, looping:boolean}
     * sparkleAnimation: details of effect to randomly play on gems that are sitting still {name:string, numCellsX:number, numCellsY:number, speed:number, looping:boolean}
     * splashAnimation: details of effect to play when a normal match is created {name:string, numCellsX:number, numCellsY:number, speed:number, looping:boolean}
     * specialFourAnimation: animation to play to indicate a match4 gem {name:string, numCellsX:number, numCellsY:number, speed:number, looping:boolean}
     * specialFiveAnimation: animation to play when a match 5 gem is matched {name:string, numCellsX:number, numCellsY:number, speed:number, looping:boolean}
     * itemLayer: layer on which to render the squares {number}
     * bottomLayer: layer on which to render background elements {number}
     * topLayer: layer on which to render foreground elements {number}
     * gravity: speed at which moving squares fall {number}
     * effectScale: scale factor applied to the size of effects {number}
     * position: central position of this behaviour {x:number, y:number}
     * glowSize: pixel size of pulsating glow effect to use on special 4 gems {number}
     */
    this.onAddToScene = function(parameters)
    {
        // Set parameters
        parameters && parameters.match3 && parameters.match3.numCells && (this.numCells = parameters.match3.numCells);
        parameters && parameters.match3 && parameters.match3.cellSize && (this.cellSize = parameters.match3.cellSize);
        parameters && parameters.match3 && parameters.match3.margin && (this.margin = parameters.match3.margin);
        parameters && parameters.match3 && parameters.match3.items && (this.items = parameters.match3.items);
        parameters && parameters.match3 && parameters.match3.specialFive && (this.specialFive = parameters.match3.specialFive);
        parameters && parameters.match3 && parameters.match3.matchSound && (this.matchSound = parameters.match3.matchSound);
        parameters && parameters.match3 && parameters.match3.explosionSound && (this.explosionSound = parameters.match3.explosionSound);
        parameters && parameters.match3 && parameters.match3.specialFiveSound && (this.specialFiveSound = parameters.match3.specialFiveSound);
        parameters && parameters.match3 && parameters.match3.explosionAnimation && (this.explosionAnimation = parameters.match3.explosionAnimation);
        parameters && parameters.match3 && parameters.match3.sparkleAnimation && (this.sparkleAnimation = parameters.match3.sparkleAnimation);
        parameters && parameters.match3 && parameters.match3.splashAnimation && (this.splashAnimation = parameters.match3.splashAnimation);
        parameters && parameters.match3 && parameters.match3.specialFourAnimation && (this.specialFourAnimation = parameters.match3.specialFourAnimation);
        parameters && parameters.match3 && parameters.match3.specialFiveAnimation && (this.specialFiveAnimation = parameters.match3.specialFiveAnimation);
        parameters && parameters.match3 && parameters.match3.itemLayer && (this.itemLayer = parameters.match3.itemLayer);
        parameters && parameters.match3 && parameters.match3.bottomLayer && (this.bottomLayer = parameters.match3.bottomLayer);
        parameters && parameters.match3 && parameters.match3.topLayer && (this.topLayer = parameters.match3.topLayer);
        parameters && parameters.match3 && parameters.match3.gravity && (this.gravity = parameters.match3.gravity);
        parameters && parameters.match3 && parameters.match3.effectScale && (this.effectScale = parameters.match3.effectScale);
        parameters && parameters.match3 && parameters.match3.position && (this.position = parameters.match3.position);
        parameters && parameters.match3 && parameters.match3.glowSize && (this.glowSize = parameters.match3.glowSize);


        // Create the board
        createBoard();

        // Main loop call back
        wade.setMainLoopCallback(update,'update');
    };

    this.onRemoveFromScene = function() // Removes all objects created by this behavior
    {
        wade.removeSceneObjects(wade.getSceneObjects('partOfMatch3', true));
        wade.setMainLoopCallback(null, 'update');
    };



    //HERE THERE BE DRAGONS

    // Contains a list of squares that need to be checked

    var check = [];
    /**
     * Pushes elements to the array only if they are not already present in the array
     * @param element to be pushed
     * @returns {*}
     */
    check.pushUnique = function(element)
    {
        if (check.indexOf(element) == -1)
        {
            return check.push(element);
        }
        return -1;
    };

    // Rarity of random sparkles, higher number means rarer
    var sparkleRarity = 2000;

    var selectedSquare = null;
    var selectorObject = {};

    var board = []; // Array to store the game board
    var columnsLocked = []; // An array to store which columns are locked

    // Flags
    var deadChilliWalking = false;
    var wholeBoardCheck = false;
    var matchSoundPlaying = false;
    var explosionSoundPlaying = false;

    /**
     * Set's which cell the selector icon should appear over
     * @param {number} x the column of the square to become selected
     * @param {number} y the row of the square to become selected
     */
    var setSelected = function(x, y)
    {
        selectedSquare = {x: x, y: y};
        selectorObject.setPosition(-self.numCells.x*self.cellSize.x/2 + x*self.cellSize.x + self.cellSize.x/2 + self.position.x, -self.numCells.y*self.cellSize.y/2 + y*self.cellSize.y + self.cellSize.y/2 + self.position.y);
        selectorObject.setVisible(true);
    };

    /**
     * Creates a single square
     * @param {string} type The type of square, important as it is used as part of the image path
     * @param {number} col The column to which the square belongs
     * @param {number} row The row to which the square belongs
     * @returns {SceneObject} Returns the square that has been created
     */
    var createSquare = function(type, typeSpecial, background, col, row)
    {
        var sprite = new Sprite(type, self.itemLayer);

        sprite.setSize(self.cellSize.x-self.margin, self.cellSize.y-self.margin);
        sprite.setVisible(false);

        var square = new SceneObject(sprite);
        square.partOfMatch3 = true;
        if(background)
        {
            var backgroundSprite = new Sprite(background, self.bottomLayer);
            backgroundSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0.0, 1.0, 0.3, backgroundSprite.getDrawFunction()));
            backgroundSprite.setSize(self.cellSize.x-self.margin/8, self.cellSize.y-self.margin/8);
            square.addSprite(backgroundSprite);
            backgroundSprite.setVisible(false);
        }
        square.changeDrawFunc = function() // Used to change fade
        {
            if(backgroundSprite)
            {
                backgroundSprite.setVisible(true);
                backgroundSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0.0, 1.0, 0.3, backgroundSprite.getDrawFunction()));
            }
            sprite.setVisible(true);
            sprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0.0, 1.0, 0.3, sprite.getDrawFunction()));
        };
        square.type = type;
        square.typeSpecial = typeSpecial;
        square.col = col;
        square.row = row;
        square.deathEffect = {type: 'none'};
        var posX = -self.numCells.x * self.cellSize.x / 2 + col * self.cellSize.x + self.cellSize.x / 2 + self.position.x;
        var posY = -self.numCells.y * self.cellSize.y / 2 + row * self.cellSize.y + self.cellSize.y / 2 + self.position.y;
        square.setPosition(posX, posY);
        square.moving = false;    // Used to stop player interacting or making matches with moving squares

        square.onSwipeLeft = function ()
        {
            if (this.col == 0)
            {
                return true;
            }
            selectorObject.setVisible(false);
            swap(board[this.col][this.row], board[this.col - 1][this.row], true);
            selectedSquare = null;
            return true;
        };

        square.onSwipeRight = function ()
        {
            if (this.col == self.numCells.x - 1)
            {
                return true;
            }
            selectorObject.setVisible(false);
            swap(board[this.col][this.row], board[this.col + 1][this.row], true);
            selectedSquare = null;
            return true;
        };

        square.onSwipeUp = function ()
        {
            if (this.row == 0)
            {
                return true;
            }
            selectorObject.setVisible(false);
            swap(board[this.col][this.row], board[this.col][this.row - 1], true);
            selectedSquare = null;
            return true;
        };

        square.onSwipeDown = function ()
        {
            if (this.row == self.numCells.y - 1)
            {
                return true;
            }
            selectorObject.setVisible(false);
            swap(board[this.col][this.row], board[this.col][this.row + 1], true);
            selectedSquare = null;
            return true;
        };

        square.onMouseDown = function ()
        {
            if (columnsLocked[this.col] || this.moving)
            {
                return true;
            }

            else if (selectedSquare) // Square already selected
            {
                // Swap with given square if move is legal
                selectorObject.setVisible(false);
                swap(board[selectedSquare.x][selectedSquare.y], board[this.col][this.row], true);
                selectedSquare = null;
                return true;
            }
            setSelected(this.col, this.row);
            return true;
        };

        // Move a board square down a set number of cells with an acceleration
        /**
         * Move the square down a set number of cells with an acceleration force
         * @param {number} dropHeight The number of cells to drop by
         * @param {number} acceleration The force of gravity
         */
        square.moveDown = function(dropHeight, acceleration)
        {
            if (this.moving)
            {
                return;
            }
            this.gravity = acceleration;
            this.verticalDisplacement = 0;
            this.targetDisplacement = dropHeight * self.cellSize.y;
            this.moving = true;
            this.startY = this.getPosition().y;
            this.row += dropHeight;

            this.onUpdate = function()
            {
                this.verticalDisplacement = this.getPosition().y - this.startY;
                if (this.verticalDisplacement < this.targetDisplacement)
                {
                    this.setVelocity({x:0, y:this.getVelocity().y + this.gravity*wade.c_timeStep});
                }
                else // Finished moving
                {
                    var overshot = this.verticalDisplacement - this.targetDisplacement;
                    this.verticalDisplacement = 0;
                    this.setPosition(this.getPosition().x, this.getPosition().y - overshot);
                    this.setVelocity({x:0, y:0});
                    this.stopListeningFor("onUpdate");
                    this.moving = false;
                    check.pushUnique(this); // Check for new matches
                }
            };
            square.listenFor("onUpdate");
        };

        square.onMoveComplete = function()
        {
            this.moving = false;
        };

        return square;
    };

    /**
     * Creates and populates the board, ensuring there are no matches
     */
    var createBoard = function ()
    {
        // Selection
        var selectorSprite = new Sprite('images/selected.png', self.topLayer);
        selectorSprite.setSize(self.cellSize.x + self.margin/2, self.cellSize.y + self.margin/2);
        selectorObject = new SceneObject(selectorSprite);
        selectorObject.partOfMatch3 = true;
        wade.addSceneObject(selectorObject);
        selectorObject.setVisible(false); // Invisible, no blocks selected at start

        // Helper function - Used to ensure no matches
        var nullMatch = function (array, item, item2)
        {
            if (item != item2)
                return; // No need unless both previous 2 match
            for (var i = 0; i < array.length; i++)
            {
                array[i].normal = array[i].normal == item ? null : array[i].normal;
            }
        };

        // Create the board array
        board = new Array(self.numCells.x);
        for (var i=0; i<self.numCells.x; i++)
        {
            columnsLocked[i] = false;
            board[i] = new Array(self.numCells.y);
        }
        // Fill the board
        for (i = 0; i < self.numCells.y; i++)
        {
            for (var j = 0; j < self.numCells.x; j++)
            {
                // Ensure no matches
                var original = [];
                for(var a=0; a<self.items.length; a++)
                {
                    original.push(wade.cloneObject(self.items[a])); // This looks dodgy
                }

                j > 1 ? nullMatch(original, board[j - 2][i].type, board[j - 1][i].type) : null;
                i > 1 ? nullMatch(original, board[j][i - 2].type, board[j][i - 1].type) : null;
                var allowed = []; // Array of allowed squares for given position to prevent match
                for (var k = 0; k < original.length; k++)
                {
                    original[k].normal && allowed.push(original[k]);
                }
                //var type = allowed[(Math.floor(Math.random() * allowed.length))];
                var type = chooseType(allowed);

                var back = null;
                if(type.background)
                {
                    back = type.background;
                }
                board[j][i] = createSquare(type.normal,type.special,back, j, i);
                wade.addSceneObject(board[j][i], true);
                board[j][i].changeDrawFunc();
            }
        }

    };

    /**
     * Swaps the position of 2 adjacent squares
     * @param {square} square1 the first square
     * @param {square} square2 the square that needs to swap locations with the first square
     * @param {boolean} check check for matches once the swap is complete
     */
    var swap = function(square1, square2, checkForMatches)
    {
        if (!square1 || !square2 || columnsLocked[square1.col] || columnsLocked[square2.col])
        {
            return false;
        }

        // Only try to swap if selected squares are adjacent
        if(!adjacent(square1, square2))
        {
            return false;
        }

        if(square1.isSpecialFive || square2.isSpecialFive)
        {
            for(var i=0; i<columnsLocked.length; i++)
            {
                // Lock all the columns
                columnsLocked[i] = true;
            }
            deadChilliWalking = true;
        }

        // Temporary variables
        var square1LocationCol = square1.col;
        var square1LocationRow = square1.row;
        var square2LocationCol = square2.col;
        var square2LocationRow = square2.row;

        // Swap the locations
        var square1Position = square1.getPosition();
        var square2Position = square2.getPosition();
        board[square1.col][square1.row] = square2;
        board[square2.col][square2.row] = square1;

        square1.col = square2LocationCol;
        square1.row = square2LocationRow;
        square2.col = square1LocationCol;
        square2.row = square1LocationRow;

        // Apply the swap
        square1.moveTo(square2Position.x, square2Position.y, 300);
        square2.moveTo(square1Position.x, square1Position.y, 300);
        square1.moving = true;
        square2.moving = true;

        // Lock columns
        columnsLocked[square1.col] = true;
        columnsLocked[square2.col] = true;

        if(!checkForMatches)
        {
            return; // Do not check for matches if flag is false
        }

        // Check for matches as a result of swap
        var numMoveCompleted = 0;
        square1.onMoveComplete = square2.onMoveComplete = function()
        {
            if (++numMoveCompleted == 2)
            {
                square1.moving = square2.moving = false;
                columnsLocked[square1.col] = false;
                columnsLocked[square2.col] = false;

                // Now need to do all match checks and swap back if there are none
                var anyMatches = false;

                anyMatches = getMatches(square1) ? true : anyMatches;
                anyMatches = getMatches(square2) ? true : anyMatches;

                // Can I handle special case of 5 here or not
                if(square1.isSpecialFive || square2.isSpecialFive)
                {
                    var square = square1.isSpecialFive ? square1 : square2;
                    var type = square1.isSpecialFive ? square2.type : square1.type;

                    if(!wade.app.soundMuted && self.matchSound)
                    {
                        wade.playAudioIfAvailable(self.matchSound);
                    }
                    square.remove = true;
                    for(var i=0; i<self.numCells.x; i++)
                    {
                        for(var j=0; j<self.numCells.y; j++)
                        {
                            var objectToRemove = board[i][j];
                            check.push(objectToRemove);
                            if(objectToRemove && objectToRemove.type == type)
                            {
                                //objectToRemove.beam = true;
                                objectToRemove.fivePos = {x:square.getPosition().x, y:square.getPosition().y};
                                objectToRemove.remove = true;

                                var beam = createBeam(objectToRemove);
                            }
                        }
                    }
                    if (beam)
                    {
                        wade.setMainLoopCallback(null, 'update');
                        beam.onAnimationEnd = function()
                        {
                            wade.removeSceneObject(this);
                            wade.setMainLoopCallback(update,'update');
                        };
                    }

                }

                // If move is illegal, swap back
                if (!anyMatches)
                {
                    if(!square1.isSpecialFive && !square2.isSpecialFive)
                    {
                        swap(square1, square2, false);
                    }
                }
                else
                {
                    check.pushUnique(square1);
                    check.pushUnique(square2);
                }

                // After everything, restore on move complete - THIS MIGHT NEED TO GO ABOVE SOMEWHERE
                square1.onMoveComplete = square2.onMoveComplete = function ()
                {
                    this.moving = false;
                };
            }
        };
    };

    /**
     * A function that determines if 2 squares are adjacent
     * @param {square} square1 first square
     * @param {square} square2 second square to be checked against square1
     * @returns {boolean} returns true if squares are adjacent
     */
    var adjacent = function(square1, square2)
    {
        var xDisplace = square1.col-square2.col;
        xDisplace = xDisplace < 0 ? xDisplace*-1 : xDisplace;
        var yDisplace = square1.row-square2.row;
        yDisplace = yDisplace < 0 ? yDisplace*-1 : yDisplace;
        return (xDisplace + yDisplace) == 1;
    };

    /**
     * Returns a list of matches for the given square
     * @param square
     * @returns {*}
     */
    var getMatches = function(square, flagAsMatched)
    {
        if(columnsLocked[square.col])
        {
            return false;
        }

        // My masterpiece
        var createMatch = function(axis, square, match)
        {
            var square2 = !columnsLocked[square.col+axis.x] && board[square.col+axis.x] && board[square.col+axis.x][square.row+axis.y];
            square && square2 && square.type == square2.type && !square2.moving && match.push(square2) && createMatch(axis, square2, match);
        };
        var horizontalMatch = [];
        var verticalMatch = [];
        createMatch({x:1, y:0}, square, horizontalMatch);
        createMatch({x:-1, y:0}, square, horizontalMatch);
        createMatch({x:0, y:1}, square, verticalMatch);
        createMatch({x:0, y:-1}, square, verticalMatch);
        horizontalMatch.push(square);
        verticalMatch.push(square);

        // Return matches
        var list = [];
        if(horizontalMatch.length > 2)
        {
            var counter = 0;
            for(var i=0; i<horizontalMatch.length; i++)
            {
                horizontalMatch[i].matched && counter++;
                if(flagAsMatched)
                {
                    horizontalMatch[i].matched = true;
                }
            }
            if(counter < horizontalMatch.length)
            {
                list.push(horizontalMatch);
            }
        }
        if(verticalMatch.length > 2)
        {
            counter = 0;
            for(i=0; i<verticalMatch.length; i++)
            {
                verticalMatch[i].matched && counter++;
                if(flagAsMatched)
                {
                    verticalMatch[i].matched = true;
                }
            }
            if(counter < verticalMatch.length)
            {
                list.push(verticalMatch);
            }
        }
        if(list.length==0)
        {
            return false;
        }
        return list;
    };

    /**
     * Handles a match made by the given square and a match
     * @param square
     * @param list
     * @returns {boolean}
     */
    var handleMatch = function(square ,match)
    {
        var length = match.length;
        if(length < 3)
        {
            return false; // No matches
        }

        // Pass match to function if it exists
        wade.app.onMatch && wade.app.onMatch(match);

        // Add time
        pointsPopup(square.getPosition(),100*length);

        // Standard match of 3
        if(length == 3)
        {
            for(j=0; j<3; j++)
            {
                match[j].deathEffect = {type:'splash'};
                match[j].remove = true;
            }
            matchSoundPlaying = true;
        }

        // Match of 4
        else if(length == 4)
        {
            matchSoundPlaying = true;

            for(var j=0; j<3; j++) // Do not remove the fourth, instead it will turn into a special gem
            {
                match[j].deathEffect = {type:'splash'};
                match[j].remove = true;
            }
            match[3].isSpecialFour = true;
            match[3].specialFourLocked = true; // Needed to prevent a match with special 4 in same frame
            var glowSprite = new Sprite(match[3].typeSpecial, self.bottomLayer);
            glowSprite.setSize(self.cellSize.x-self.margin, self.cellSize.y-self.margin);
            glowSprite.setDrawFunction(wade.drawFunctions.resizePeriodically_(self.cellSize.x-self.margin, self.cellSize.y-self.margin, self.cellSize.x + self.glowSize-self.margin, self.cellSize.y + self.glowSize-self.margin, 0.4, glowSprite.getDrawFunction()));
            match[3].addSprite(glowSprite);
            if(self.specialFourAnimation)
            {
                var lineFourAnim = new Animation(self.specialFourAnimation.name, self.specialFourAnimation.numCellsX, self.specialFourAnimation.numCellsY, self.specialFourAnimation.speed, self.specialFourAnimation.looping);
                var lineFourSprite = new Sprite(null, self.itemLayer); // Behind squares
                lineFourSprite.addAnimation('dazzle', lineFourAnim);
                lineFourSprite.setSize(self.cellSize.x-self.margin, self.cellSize.y-self.margin);
                match[3].addSprite(lineFourSprite, {x:0, y:5});
                match[3].playAnimation('dazzle', 'ping-pong');
            }

        }
        else // Must be a match of 5 or greater
        {
            matchSoundPlaying = true;
            for(j=0; j<match.length-1; j++) // Do not remove the fourth, instead it will turn into a special gem
            {
                match[j].deathEffect = {type:'splash'};
                match[j].remove = true;
            }

            match[match.length-1].removeAllSprites();
            var fiveSprite = new Sprite(self.specialFive, self.itemLayer);
            fiveSprite.setSize(self.cellSize.x-self.margin, self.cellSize.y-self.margin);
            match[match.length-1].addSprite(fiveSprite);
            match[match.length-1].isSpecialFive = true;
            match[match.length-1].type = 'special5';
        }

        // Handle special case, a special 4 item is involved in the swap
        for(j=0; j<match.length; j++)
        {
            if(match[j].isSpecialFour)
            {
                // We have a special 4 involved in the match, it must explode and remove the others with it
                if(match[j].specialFourLocked)
                {
                    continue;
                }
                explosionSoundPlaying = true;

                // Remove all around
                for(var a=-1; a<2; a++)
                {
                    for(var b=-1; b<2; b++)
                    {
                        if(board[match[j].col+a] && board[match[j].col+a][match[j].row+b] && !columnsLocked[match[j].col+a] && !board[match[j].col+a][match[j].row+b].moving)
                        {
                            // If not in templist, add to array and flag for removal
                            if(match.indexOf(board[match[j].col+a][match[j].row+b]) == -1)
                            {
                                match.push(board[match[j].col+a][match[j].row+b]);
                                board[match[j].col+a][match[j].row+b].remove = true;
                            }
                            // Flag all to explode
                            board[match[j].col+a][match[j].row+b].deathEffect = {type:'explode'}; // If already in list still must explode
                        }
                    }
                }
            }
        }
        return true;
    };

    /**
     * Used to add a sparkle to a location
     */
    var createSparkle = function(pos)
    {
        if(!self.sparkleAnimation)
        {
            return;
        }
        var sparkleSprite = new Sprite(null, self.topLayer);
        var sparkleAnim = new Animation(self.sparkleAnimation.name, self.sparkleAnimation.numCellsX, self.sparkleAnimation.numCellsY, self.sparkleAnimation.speed, self.sparkleAnimation.looping);
        sparkleSprite.addAnimation('asd', sparkleAnim);
        sparkleSprite.setSize(self.cellSize.x*self.effectScale-self.margin, self.cellSize.y*self.effectScale-self.margin);
        sparkleSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0.0, 1.0, 0.2, sparkleSprite.getDrawFunction(), function()
        {
            sparkleSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(1.0, 0.0, 1.0, sparkleSprite.getDrawFunction()));
        }));
        var sparkle = new SceneObject(sparkleSprite);
        sparkle.setPosition(pos.x, pos.y);
        sparkle.partOfMatch3 = true;
        sparkle.onAnimationEnd = function()
        {
            wade.removeSceneObject(this);
        };
        wade.addSceneObject(sparkle, true);
    };

    /**
     * Used to create a splash effect at a given location
     * @param pos
     */
    var createSplash = function(pos)
    {
        if(!self.splashAnimation)
        {
            return;
        }
        // Create splash effect
        var splashSprite = new Sprite(null, self.topLayer);
        var splashAnim = new Animation(self.splashAnimation.name, self.splashAnimation.numCellsX, self.splashAnimation.numCellsY, self.splashAnimation.speed, self.splashAnimation.looping);
        splashSprite.addAnimation('asd', splashAnim);
        splashSprite.setSize(self.cellSize.x*self.effectScale-self.margin, self.cellSize.y*self.effectScale-self.margin);
        var splash = new SceneObject(splashSprite);
        splash.partOfMatch3 = true;
        splash.setPosition(pos.x, pos.y);
        splash.onAnimationEnd = function()
        {
            wade.removeSceneObject(this);
        };
        wade.addSceneObject(splash, true);
    };

    /**
     * Creates an explosion effect at given location
     * @param pos
     */
    var createExplosion = function(pos)
    {
        if(!self.explosionAnimation)
        {
            return;
        }

        // Create explosion effect
        var explosionSprite = new Sprite(null, self.topLayer);
        //var explosionAnim = new Animation('images/bigBoom.png', 6, 4, 30, false);
        var explosionAnim =  new Animation(self.explosionAnimation.name, self.explosionAnimation.numCellsX, self.explosionAnimation.numCellsY, self.explosionAnimation.speed, self.explosionAnimation.looping);
        explosionSprite.addAnimation('asd', explosionAnim);
        explosionSprite.setSize(self.cellSize.x*self.effectScale-self.margin, self.cellSize.y*self.effectScale-self.margin);
        var explosion = new SceneObject(explosionSprite);
        explosion.partOfMatch3 = true;
        explosion.setPosition(pos.x, pos.y);
        explosion.onAnimationEnd = function()
        {
            wade.removeSceneObject(this);
        };
        wade.addSceneObject(explosion, true);
    };

    /**
     * Creates a beam effect for provided square, square must have certain properties initialised
     * @param square
     * @returns {SceneObject}
     */
    var createBeam = function(square)
    {
        // Create sparkle around object being removed
        var specialAnim = new Animation(self.sparkleAnimation.name, self.sparkleAnimation.numCellsX, self.sparkleAnimation.numCellsY, self.sparkleAnimation.speed, self.sparkleAnimation.looping);
        var animSprite = new Sprite(null, self.itemLayer); // Behind squares
        animSprite.addAnimation('dazzle', specialAnim);
        var sparkle = new SceneObject(animSprite);
        sparkle.partOfMatch3 = true;
        sparkle.onAnimationEnd = function()
        {
            wade.removeSceneObject(this);
        };
        wade.addSceneObject(sparkle, true);
        sparkle.setPosition(square.getPosition().x, square.getPosition().y);

        // Create the red beam
        var beamSprite = new Sprite(null, self.topLayer);
        var beamAnim = new Animation(self.specialFiveAnimation.name, self.specialFiveAnimation.numCellsX, self.specialFiveAnimation.numCellsY, self.specialFiveAnimation.speed, self.specialFiveAnimation.looping);
        beamSprite.addAnimation('asd', beamAnim);
        var difference = wade.vec2.sub(square.fivePos, square.getPosition());
        var height = wade.vec2.length(difference) + wade.vec2.length(difference)/5;
        beamSprite.setSize(self.cellSize.x/2, height);
        var beam = new SceneObject(null);
        beam.partOfMatch3 = true;
        beam.setPosition(square.fivePos.x, square.fivePos.y);
        beam.addSprite(beamSprite, {x:0, y:-height/2});
        beam.onAnimationEnd = function()
        {
            deadChilliWalking = false;
            wade.removeSceneObject(this);
        };
        beam.setRotation(Math.atan2(-difference.x, difference.y));
        wade.addSceneObject(beam, true);

        return beam;
    };

    /**
     * Checks all squares in check list, finds matches if any, then moves
     */
    var update = function()
    {
        // Play sounds
        // Create explosion sound
        if(matchSoundPlaying && !wade.app.soundMuted && self.matchSound)
        {
            wade.playAudioIfAvailable(self.matchSound);
        }
        // Create explosion sound
        if(explosionSoundPlaying && !wade.app.soundMuted && self.explosionSound)
        {
            wade.playAudioIfAvailable(self.explosionSound);
        }
        matchSoundPlaying = false;
        explosionSoundPlaying = false;

        var removalList = [];

        // Check for game over
        if(wade.app.gameOver)
        {
            self.musicSource && wade.stopAudio(self.musicSource);
            self.gameOver = false;
            wade.setMainLoopCallback(null,'update');

            // Clear all gems with cool explosions
            for(var i=0; i<self.numCells.x; i++)
            {
                for(var j=0; j<self.numCells.y; j++)
                {
                    if(board[i] && board[i][j])
                    {
                        wade.removeSceneObject(board[i][j]);
                        createExplosion(board[i][j].getPosition());
                        board[i][j] = null;
                    }
                }
            }
            // Hide selector object
            selectorObject.setVisible(false);
            selectedSquare = null;
            wade.removeSceneObject(selectorObject);

            wade.app.onGameOver && wade.app.onGameOver();
            return;
        }

        // Unlock any columns that have no moving squares
        for(i=0; i<self.numCells.x && !deadChilliWalking; i++)
        {
            var lock = false;
            for(j=0; j<self.numCells.y && lock==false; j++)
            {
                lock = (board[i][j] && board[i][j].moving);
            }
            columnsLocked[i] = lock;
        }

        if(check.length <= 0) // No blocks need checking
        {
            if(!wholeBoardCheck)
            {
                // Check whole board
                for(i=0; i<self.numCells.x; i++)
                {
                    for(j=0; j<self.numCells.y; j++)
                    {
                        check.pushUnique(board[i][j]);
                    }
                }
                wholeBoardCheck = true;

                // Check that there are matches remaining
                if(!validMoves())
                {
                    var sprite = new TextSprite("NO MOVES LEFT!",self.cellSize.x/1.5 + 'px ArtDept1', '#ff5613', 'center', self.topLayer);
                    sprite.setShadow('#ffffff', 2, 2, 2);
                    sprite.drawToImage('noMoves', true);
                    sprite = new Sprite('noMoves', self.topLayer);
                    sprite.setDrawFunction(wade.drawFunctions.resizePeriodically_(sprite.getSize().x, sprite.getSize().y, sprite.getSize().x + 20, sprite.getSize().y + 10, 0.5, sprite.getDrawFunction()));
                    var message = new SceneObject(sprite);
                    message.partOfMatch3 = true;
                    message.setPosition(self.position);
                    message.timer = function()
                    {
                        wade.removeSceneObject(this);
                    };
                    wade.addSceneObject(message, true);
                    message.schedule(3000, 'timer');

                    for(i=0; i<self.numCells.x; i++)
                    {
                        for(j=0; j<self.numCells.y; j++)
                        {
                            board[i][j].noMoveDelay = function()
                            {
                                this.remove = true;
                            };
                            board[i][j].schedule(3000, 'noMoveDelay');
                        }
                    }
                }
            }
        }

        else
        {
            wholeBoardCheck = false;
        }

        var numRemovedFromColumn = [];

        // Remove objects that are moving from check list
        for(i=0; i<check.length; i++)
        {
            if(check[i].moving)
            {
                check[i] = null; // Removing moving elements from list
            }
        }

        // Initialise arrays
        for(var i=0; i<self.numCells.x; i++)
        {
            numRemovedFromColumn.push(0);
        }

        // Check for matches on all flagged squares, and flag appropriate squares for removal
        var matches = [];
        for(i=0; i<check.length && check[i]; i++)
        {
            var match = {check:null, match:null};
            match.match = getMatches(check[i], true);   // Need to remove duplicate matches here I think - Confirmed need a clever system
                                                        // Confirmed, and difficult because matches may be null, a single array, or an array of arrays
                                                        // also squares can be modified so wont match, have to compare rows and columns.
                                                        // Only remove if all squares are a match

            if(match.match) // Push matches to single array
            {
                match.check = check[i];

                for(j=0; j<match.match.length; j++)
                {
                    matches.push({match:match.match[j], check:check[i]});
                }
            }
        }

        // Handle the matches
        for(i=0; i<matches.length; i++)
        {
            matches[i] && handleMatch(matches[i].check, matches[i].match);
        }


        // Clear check list
        check.length = 0;

        // Remove all flagged squares and create random sparkle effects
        for(i=0; i<self.numCells.x; i++)
        {
            for(j=0; j<self.numCells.y; j++)
            {
                // Unlock special 4 gems created this time
                if(board[i] && board[i][j])
                {
                    if(board[i][j].specialFourLocked)
                    {
                        board[i][j].specialFourLocked = false;
                    }

                    if(board[i][j].remove)
                    {
                        var pos = {x:board[i][j].getPosition().x, y: board[i][j].getPosition().y};
                        columnsLocked[i] = true; // LOCK THE COLUMN

                        // Use correct death effect
                        if(board[i][j].deathEffect.type == 'explode')
                        {
                            createExplosion(pos);
                        }
                        else
                        {
                            createSplash(pos);
                        }
                        wade.removeSceneObject(board[i][j]);
                        board[i][j] = null;
                    }

                    else if(board[i][j].moving == false && !board[i][j].isSpecialFour && Math.floor(Math.random()*sparkleRarity) < 1) // 1
                    {
                        createSparkle(board[i][j].getPosition());
                    }

                }
            }
        }

        removalList.length = 0;

        // Now we need to make squares move, this has to be done in reverse to ensure squares are not overwritten
        for(i=0; i<self.numCells.x; i++)
        {
            var numDown = 0;
            for(var j = self.numCells.y-1; j>-1; j--) // Start at bottom and move squares
            {
                if(!board[i][j])
                {
                    numDown++;
                }
                else if(numDown > 0)
                {
                    board[i][j].moveDown(numDown, self.gravity);
                    board[i][j+numDown] = board[i][j];
                }
            }

            // Create new squares
            for(j=0; j<numDown; j++)
            {
                var counter = 0;
                var original = self.items.slice(0); // Need to do something way more sophisticated here
                var type = chooseType(original);
                var back = null;
                if(type.background)
                {
                    back = type.background;
                }
                var square = createSquare(type.normal, type.special, back, i, -j-1);
                wade.addSceneObject(square, true);
                square.schedule(140*Math.abs(-j-1), 'changeDrawFunc'); // Fade delay
                board[i][numDown-j-1] = square;
                square.moveDown(numDown, self.gravity);

                counter++;
            }
        }

        // Make sure the arrays are wiped out
        numRemovedFromColumn.length = 0;
    };

    var pointsPopup = function(position, score)
    {
        wade.app.onScoreAdded && wade.app.onScoreAdded(score);
        var text = new TextSprite(score,self.cellSize.x/2.4 + 'px ArtDept1', '#ff5613', 'center', self.topLayer);
        text.setShadow('#ffffff', 2, 2, 2);
        var object = new SceneObject(text);
        object.partOfMatch3 = true;
        object.setPosition(position.x + Math.floor((Math.random()-0.5) * 100), position.y + Math.floor((Math.random()-0.5) * 100));
        text.setDrawFunction(wade.drawFunctions.fadeOpacity_(1.0, 0.0, 0.6, text.getDrawFunction(), function()
        {
            wade.removeSceneObject(object);
        }));
        object.moveTo(object.getPosition().x, object.getPosition().y - 100, 100);
        wade.addSceneObject(object);
    };

    /**
     * Returns the number of valid moves
     */
    var validMoves = function()
    {
        var objects = wade.getSceneObject('isSpecialFive', true);
        if(objects)
        {
            return true;
        }

        for (var i=0; i<self.numCells.x; i++)
        {
            for(var j=0; j<self.numCells.y; j++)
            {
                if(board[i][j].moving)
                {
                    return true;
                }


                if(board[i+1])
                {
                    // Swap horizontally
                    var temp = board[i][j];
                    var one = {x:board[i][j].col, y:board[i][j].row};
                    var two = {x:board[i+1][j].col, y:board[i+1][j].row};
                    board[i][j] = board[i+1][j];
                    board[i+1][j] = temp;
                    board[i][j].col = one.x;
                    board[i][j].row = one.y;
                    board[i+1][j].col = two.x;
                    board[i+1][j].row = two.y;

                    // check for matches
                    var matches = getMatches(board[i][j]) || getMatches(board[i + 1][j]);

                    // Undo
                    temp = board[i][j];
                    one = {x:board[i][j].col, y:board[i][j].row};
                    two = {x:board[i+1][j].col, y:board[i+1][j].row};
                    board[i][j] = board[i+1][j];
                    board[i+1][j] = temp;
                    board[i][j].col = one.x;
                    board[i][j].row = one.y;
                    board[i+1][j].col = two.x;
                    board[i+1][j].row = two.y;

                    if (matches)
                    {
                        return true;
                    }
                }

                if(board[i][j+1])
                {
                    // Swap vertically
                    temp = board[i][j];
                    one = {x:board[i][j].col, y:board[i][j].row};
                    two = {x:board[i][j+1].col, y:board[i][j+1].row};
                    board[i][j] = board[i][j+1];
                    board[i][j+1] = temp;
                    board[i][j].col = one.x;
                    board[i][j].row = one.y;
                    board[i][j+1].col = two.x;
                    board[i][j+1].row = two.y;

                    // check for matches
                    matches = getMatches(board[i][j]) || getMatches(board[i][j+1]);

                    // Undo
                    temp = board[i][j];
                    one = {x:board[i][j].col, y:board[i][j].row};
                    two = {x:board[i][j+1].col, y:board[i][j+1].row};
                    board[i][j] = board[i][j+1];
                    board[i][j+1] = temp;
                    board[i][j].col = one.x;
                    board[i][j].row = one.y;
                    board[i][j+1].col = two.x;
                    board[i][j+1].row = two.y;

                    if(matches)
                    {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    /**
     * Takes a list of allowed items and returns one based on the probability
     * @param types
     */
    var chooseType = function(types)
    {
        types.sort(function(a, b)
        {
            return a.probability - b.probability;
        });
        var total = 0;
        for(var i=0; i<types.length; i++)
        {
            total += types[i].probability;
        }

        var rand = Math.floor(Math.random()*total);
        var sum = 0;
        for(i=0; i<types.length; i++)
        {
            if(rand < types[i].probability + sum)
            {
                return types[i];
            }
            sum += types[i].probability;
        }
    };
};

//@ sourceURL=match.js
