// Open Source Match 3 Game by Clockworkchilli
App = function()
{
    var self = this; // Main app context

    // Layers to use for rendering
    this.layers = {background:17, boardBack:16, board:15, boardFront:14, front:13};

    // Flags
    this.musicMuted = false;
    this.soundMuted = false;
    this.socialEnabled = true;
    this.gameOver = false;

    // Scores
    this.scores = {values:[0,0,0]};

    /**
     * Function that takes a number of seconds and returns a string of the time in minutes
     * @param {number} numSeconds The number of seconds that we will convert
     * @returns {string} A string representation of the provided time in minutes
     */
    this.getTimeString = function (numSeconds)
    {
        if (!numSeconds || numSeconds < 1)
        {
            return '0:00';
        }

        var timeString = '';
        var minutes = 0;
        var seconds = Math.floor(numSeconds);

        // Deal with minutes
        while (seconds >= 60)
        {
            seconds -= 60;
            minutes++;
        }

        timeString = minutes > 0 ? minutes + ':' : '0:';

        // Deal with seconds
        if (seconds > 0)
        {
            timeString += seconds < 10 ? ('0' + seconds) : seconds;
        }
        else
        {
            timeString += '00';
        }
        return timeString;
    };

    // Load all assets
    this.load = function()
    {
        // LOAD SCRIPTS
        wade.loadScript('bar.js');
        wade.loadScript('counter.js');
        wade.loadScript('match3.js');

        // Load AUDIO
        if (wade.isWebAudioSupported())
        {
            // background music
            wade.preloadAudio('sounds/Surreal-Chase.ogg', false, true);
        }

        if (wade.isWebAudioSupported())
        {
            wade.loadAudio('sounds/metalImpact2.ogg');
            wade.loadAudio('sounds/fiveSound.ogg');
            wade.loadAudio('sounds/explosion1.ogg');
        }

        // LOAD IMAGES
        // Squares
        wade.loadImage('images/red.png');
        wade.loadImage('images/blue.png');
        wade.loadImage('images/green.png');
        wade.loadImage('images/yellow.png');
        wade.loadImage('images/selected.png');
        wade.loadImage('images/special4.png');
        wade.loadImage('images/special5.png');
        wade.loadImage('images/redGlow.png');
        wade.loadImage('images/blueGlow.png');
        wade.loadImage('images/greenGlow.png');
        wade.loadImage('images/yellowGlow.png');

        // UI and background
        wade.loadImage('images/background.png');
        wade.loadImage('images/top.png');
        wade.loadImage('images/barTime.png');
        wade.loadImage('images/markerTime.png');
        wade.loadImage('images/buttonSoundOff.png');
        wade.loadImage('images/buttonSoundOn.png');
        wade.loadImage('images/buttonBack.png');
        wade.loadImage('images/potionBar.png');
        wade.loadImage('images/menuBackground.png');
        wade.loadImage('images/wordTitle.png');
        wade.loadImage('images/potionTitle.png');
        wade.loadImage('images/buttonPlay.png');
        wade.loadImage('images/backgroundShareBox.png');
        wade.loadImage('images/buttonCredit.png');
        wade.loadImage('images/wadePowered.png');
        wade.loadImage('images/buttonsMuteOn.png');
        wade.loadImage('images/buttonsMuteOff.png');
        wade.loadImage('images/buttonPause.png');
        wade.loadImage('images/buttonUnpause.png');

        // Shiny
        wade.loadImage('images/shatter.png');
        wade.loadImage('images/specialEffect1.png');
        wade.loadImage('images/bigBoom.png');
        wade.loadImage('images/fiveEffect.png');
        wade.loadImage('images/flash.png');

        // Share
        wade.loadImage('images/google.png');
        wade.loadImage('images/facebook.png');
        wade.loadImage('images/twitter.png');

    };

    // Enter main program
    this.init = function()
    {
        // Setup screen
        wade.setMinScreenSize(608, 920); //996
        wade.setMaxScreenSize(608, 920); //996

        wade.setSwipeTolerance(1, 2);

        // {background:17, boardBack:16, board:15, boardFront:14, front:13};
        wade.setLayerRenderMode(self.layers.background, "webgl");
        wade.setLayerRenderMode(self.layers.boardBack, "webgl");
        wade.setLayerRenderMode(self.layers.board, "webgl");
        wade.setLayerRenderMode(self.layers.boardFront, "webgl");
        //wade.setLayerRenderMode(self.layers.front, "webgl"); // Need 1 canvas layer for timer bar gradient and other etc

        // Lower resolution factor if mobile
        if (wade.getContainerHeight() <= 768)
        {
            self.isMobile = true;
            wade.setLayerResolutionFactor(this.layers.background, 0.75);
            wade.setLayerResolutionFactor(this.layers.boardBack, 0.75);
            wade.setLayerResolutionFactor(this.layers.board, 0.75);
            wade.setLayerResolutionFactor(this.layers.boardFront, 0.75);
            wade.setLayerResolutionFactor(this.layers.front, 0.75);
        }
        else
        {
            self.isMobile = false;
        }

        // Create main menu and the game on play pressed
        this.game();
    };

    /**
     * Creates the main menu
     */
    this.game = function()
    {
        // Create menu graphical elements
        var backgroundSprite = new Sprite('images/menuBackground.png', this.layers.boardBack);
        var menu = new SceneObject(backgroundSprite);
        wade.addSceneObject(menu, true);
        var titleSprite = new Sprite('images/wordTitle.png', this.layers.board);
        menu.addSprite(titleSprite, {x: 0, y:-wade.getScreenHeight()/2 + 100});
        var potionSprite = new Sprite('images/potionTitle.png', this.layers.board);
        menu.addSprite(potionSprite, {x:0, y:-130});
        var shareBackSprite = new Sprite('images/backgroundShareBox.png', wade.app.layers.front);
        menu.addSprite(shareBackSprite, {x:-wade.getScreenWidth()/2 + 175, y:wade.getScreenHeight()/2 - 125});

        // Create play button
        var playButtonSprite = new Sprite('images/buttonPlay.png', wade.app.layers.front);
        var playButton = new SceneObject(playButtonSprite);
        playButton.onMouseUp = function()
        {
            wade.clearScene();
            if(!self.musicMuted)
            {
                self.musicPlaying = true;
                self.musicSource = wade.playAudio('sounds/Surreal-Chase.ogg', true);
            }

            // Draw background and foreground
            var backgroundSprite = new Sprite('images/background.png', self.layers.background);
            backgroundSprite.setSize(608, 920);
            var topSprite = new Sprite('images/top.png', self.layers.front);
            var graphics = new SceneObject(null);
            graphics.addSprite(backgroundSprite, {x:0, y:wade.getScreenHeight()/2 - backgroundSprite.getSize().y/2});
            graphics.addSprite(topSprite, {x:0, y:-backgroundSprite.getSize().y/2 + 74}); // Evil magic numbers
            wade.addSceneObject(graphics);

            // Use Match3 behavior to create the game
            this.theGame = new SceneObject(null, Match3);
            wade.addSceneObject(this.theGame, true, {match3:
            {
                numCells: {x:7, y:7},
                cellSize: {x:85, y:85},
                margin: 5,
                items: [{normal: 'images/red.png', special:'images/redGlow.png', probability:25},
                    {normal: 'images/blue.png', special:'images/blueGlow.png', probability:25},
                    {normal: 'images/green.png', special:'images/greenGlow.png', probability:25},
                    {normal: 'images/yellow.png', special:'images/yellowGlow.png', probability:25}],
                specialFive: 'images/special5.png',
                matchSound: 'sounds/metalImpact2.ogg',
                explosionSound: 'sounds/explosion1.ogg',
                specialFiveSound: 'sounds/fiveSound.ogg',
                itemLayer: self.layers.board,
                bottomLayer: self.layers.boardBack,
                topLayer: self.layers.boardFront,
                gravity: 2000,
                effectScale: 1.5,
                sparkleAnimation: {name:'images/specialEffect1.png', numCellsX:5, numCellsY:4, speed:15, looping:false},
                splashAnimation: {name:'images/shatter.png', numCellsX:5, numCellsY:5, speed:60, looping:false},
                explosionAnimation: {name:'images/bigBoom.png', numCellsX:6, numCellsY:4, speed:30, looping:false},
                specialFourAnimation: {name:'images/flash.png', numCellsX:4, numCellsY:3, speed:15, looping:true},
                specialFiveAnimation: {name:'images/fiveEffect.png',numCellsX:5, numCellsY:4, speed:30, looping:false},
                glowSize:16

            }});

            // Create the timer
            var timerBarSprite = new Sprite('images/barTime.png', self.layers.front); //self.layers.front
            var timer = new SceneObject(timerBarSprite, Bar);
            //timer.setSpriteOffsets(timerOffset);
            timer.removeOnGameOver = true;
            timer.timePassed = 0;
            timer.setPosition(0, 330);
            timer.onUpdate = function () {
                timer.timePassed += wade.c_timeStep;
                var percent = (30 - timer.timePassed) / 30 * 100;
            };
            wade.addSceneObject(timer, true);
            timer.getBehavior('Bar').init({bar: {size: {x: 580, y: 30},
                timer: 30,
                layer: self.layers.front,
                reverse: true,
                offset: {x:0,y:0},
                spriteIndex: 1,
                useGradient: true,
                foreColor: ['#00FF00', '#FF0000'],
                marker: 'images/markerTime.png',
                markerLayer: self.layers.front}});

            wade.app.onScoreAdded = function(value)
            {
                timer.getBehavior().addTime(value/300);
            };

            self.inGameButtons();

            // Create score text
            var scoreText = new TextSprite('SCORE','64px ArtDept1', 'white', 'center', self.layers.front);
            scoreText.setShadow('#000000', 1, 2, 2);
            var scoreT = new TextSprite('0', '42px Monopower', 'white', 'center', self.layers.front);
            scoreT.setShadow('#000000', 3, 0, 4);
            self.scoreObject = new SceneObject(scoreT, Counter);
            self.scoreObject.removeOnGameOver = true;
            self.scoreObject.setPosition(0, -wade.getScreenHeight()/2 + 138);
            self.scoreObject.addSprite(scoreText, {x:0, y:-65});
            wade.addSceneObject(self.scoreObject);

            // Increment score
            self.onMatch = function(match)
            {
                self.scoreObject.getBehavior().addValue(match.length*100);
            };

        };
        playButton.setPosition(0, 130);
        playButtonSprite.setDrawFunction(wade.drawFunctions.resizeOverTime_ (30, 16, 301, 156, 0.3, playButtonSprite.getDrawFunction(), function()
        {
            // Create credits button
            var creditsButtonSprite = new Sprite('images/buttonCredit.png', self.layers.front);
            var creditsButton = new SceneObject(creditsButtonSprite);
            creditsButtonSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0.0, 1.0, 1.0, creditsButtonSprite.getDrawFunction()));
            creditsButton.onMouseUp = function()
            {
                wade.clearScene();
                self.credits();
            };
            creditsButton.setPosition(-wade.getScreenWidth()/2 + 175, wade.getScreenHeight()/2 - 180);
            wade.addSceneObject(creditsButton, true);

            // Create share buttons if social flag set
            if(self.socialEnabled)
            {
                var google = new Sprite('images/google.png', self.layers.front);
                google.setDrawFunction(wade.drawFunctions.fadeOpacity_(0, 1, 0.5, google.getDrawFunction()));
                var googleObj = new SceneObject(google);
                googleObj.onMouseUp = function()
                {
                    open('https://plus.google.com/share?url=http%3A%2F%2Fccgames.cc%2Fstg', '_blank');
                };
                googleObj.setPosition(-wade.getScreenWidth()/2 + 95, wade.getScreenHeight()/2 - 75);
                wade.addSceneObject(googleObj, true);

                var facebook = new Sprite('images/facebook.png', self.layers.front);
                facebook.setDrawFunction(wade.drawFunctions.fadeOpacity_(0, 1, 0.5, facebook.getDrawFunction()));
                var facebookObj = new SceneObject(facebook);
                facebookObj.onMouseUp = function()
                {
                    open('https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fccgames.cc%2Fstg&t=Save%20The%20Galaxy%20', '_blank');
                };
                facebookObj.setPosition(-wade.getScreenWidth()/2 + 175, wade.getScreenHeight()/2 - 75);
                wade.addSceneObject(facebookObj, true);

                var twitter = new Sprite('images/twitter.png', self.layers.front);
                twitter.setDrawFunction(wade.drawFunctions.fadeOpacity_(0, 1, 0.5, twitter.getDrawFunction()));
                var twitterObj = new SceneObject(twitter);
                twitterObj.onMouseUp = function()
                {
                    open('https://twitter.com/share?url=http%3A%2F%2Fccgames.cc%2Fstg&via=ClockworkChilli&text=Check%20out%20this%20awesome%20top-down%20shooter%20game%20%23freegame%20%23html5', '_blank');
                };
                twitterObj.setPosition(-wade.getScreenWidth()/2 + 255, wade.getScreenHeight()/2 - 75);
                wade.addSceneObject(twitterObj, true);
            }
        }));
        wade.addSceneObject(playButton, true);

        // Create wade icon
        var wadeSprite = new Sprite('images/wadePowered.png', self.layers.front);
        var wadeObj = new SceneObject(wadeSprite);
        wadeObj.setPosition(wade.getScreenWidth()/2 - wadeSprite.getSize().x/2, wade.getScreenHeight()/2 - wadeSprite.getSize().y/2);
        wadeObj.onMouseUp = function()
        {
            open('http://www.clockworkchilli.com');
        };
        wade.addSceneObject(wadeObj, true);
    };

    /**
     * Creates the credits page
     */
    this.credits = function()
    {
        // Credits background
        var backgroundSprite = new Sprite('images/menuBackground.png', this.layers.front);
        var background = new SceneObject(backgroundSprite);
        wade.addSceneObject(background);

        // Main menu button
        var backSprite = new Sprite('images/buttonBack.png', this.layers.front);
        var backButton = new SceneObject(backSprite);
        backButton.onMouseUp = function()
        {
            wade.clearScene();
            self.game();
        };
        backButton.setPosition(0, wade.getScreenHeight()/2 - 75);
        wade.addSceneObject(backButton, true);

        // Credits
        var theGang = new TextSprite('The Gang','72px ArtDept1', 'white', 'center', this.layers.front);
        theGang.setShadow('#000000', 3, 4, 4);
        var workerBees = new TextSprite('Artist: Rachel Kehoe \n\nProgrammer: Stephen Surtees\n\nDirector: Giordano Ferdinandi','34px ArtDept1', 'white', 'left', wade.app.layers.front);
        workerBees.setShadow('#000000', 1, 2, 2);
        var textObject = new SceneObject(theGang);
        textObject.addSprite(workerBees, {x:-275, y: 75});
        textObject.setPosition(0, -wade.getScreenHeight()/2 + 80);

        // Add clockwork chilli link
        var chilliLink = new TextSprite('www.clockworkchilli.com','42px ArtDept1', 'blue', 'center', this.layers.front);
        var chilli = new SceneObject(chilliLink);
        chilli.onMouseUp = function()
        {
            open('http://www.clockworkchilli.com');
        };
        chilli.setPosition(0, -75);
        wade.addSceneObject(chilli, true);

        var specialThanks = new TextSprite('Special Thanks','48px ArtDept1', 'white', 'center', this.layers.front);
        specialThanks.setShadow('#000000', 3, 4, 4);
        textObject.addSprite(specialThanks, {x:0, y: 460});
        var soundCredit = new TextSprite('Track: \"Surreal Chase\"\n\nBy Eric Matyas','34px ArtDept1', 'white', 'center', this.layers.front);
        soundCredit.setShadow('#000000', 1, 2, 2);
        textObject.addSprite(soundCredit, {x:0, y: 530});

        // Link to sound
        var soundLink = new TextSprite('www.soundimage.org','42px ArtDept1', 'blue', 'center', this.layers.front);
        var soundObject = new SceneObject(soundLink);
        soundObject.onMouseUp = function()
        {
            open('http://www.soundimage.org');
        };
        soundObject.setPosition(0, 300);
        wade.addSceneObject(textObject);
        wade.addSceneObject(soundObject, true);
    };

    /**
     * Creates the buttons on the bottom bar in game
     */
    this.inGameButtons = function()
    {
        // Create the music mute button
        if(self.musicMuted)
        {
            var muteSprite = new Sprite('images/buttonSoundOff.png', self.layers.front);
        }
        else
        {
            var muteSprite = new Sprite('images/buttonSoundOn.png', self.layers.front);
        }

        var muteButton = new SceneObject(muteSprite);
        muteButton.removeOnGameOver = true;
        muteButton.onMouseDown = function()
        {
            self.musicMuted = !self.musicMuted;
            if(self.musicMuted)
            {
                if(self.musicPlaying)
                {
                    self.musicPlaying = false;
                    wade.stopAudio(self.musicSource);
                    muteSprite.setImageFile('images/buttonSoundOff.png');
                }
                else
                {
                    self.musicMuted = !self.musicMuted;
                }

            }
            else
            {
                if(!self.musicPlaying)
                {
                    self.musicPlaying = true;
                    self.musicSource = wade.playAudio('sounds/Surreal-Chase.ogg', true);
                    muteSprite.setImageFile('images/buttonSoundOn.png');
                }
                else
                {
                    self.musicMuted = !self.musicMuted;
                }
            }
        };
        muteButton.setPosition(200, wade.getScreenHeight()/2 - muteSprite.getSize().y/2);
        wade.addSceneObject(muteButton, true);

        // Create the sound mute button
        if(self.soundMuted)
        {
            var muteSprite2 = new Sprite('images/buttonsMuteOff.png', self.layers.front);
        }
        else
        {
            var muteSprite2 = new Sprite('images/buttonsMuteOn.png', self.layers.front);
        }
        var muteButton2 = new SceneObject(muteSprite2);
        muteButton2.removeOnGameOver = true;
        muteButton2.onMouseUp = function()
        {
            self.soundMuted = !self.soundMuted;
            if(self.soundMuted)
            {
                muteSprite2.setImageFile('images/buttonsMuteOff.png');
            }
            else
            {
                muteSprite2.setImageFile('images/buttonsMuteOn.png');
            }
        };
        muteButton2.setPosition(75, wade.getScreenHeight()/2 - muteSprite2.getSize().y/2);
        wade.addSceneObject(muteButton2, true);

        // Create the main menu button
        var menuSprite = new Sprite('images/buttonBack.png', self.layers.front);
        var menuObject = new SceneObject(menuSprite);
        menuObject.removeOnGameOver = true;
        menuObject.onMouseUp = function()
        {
            wade.setMainLoopCallback(null,'update');
            wade.stopAudio(self.musicSource);
            wade.clearScene(); // Clear the scene
            if(pauseButton.paused)
            {
                wade.resumeSimulation();
            }
            self.game(); // Create main menu
        };
        menuObject.setPosition(-200, wade.getScreenHeight()/2 - muteSprite.getSize().y/2);
        wade.addSceneObject(menuObject, true);

        // Create the pause/play button
        var pauseText = new TextSprite('PAUSED','100px ArtDept1', 'white', 'center', self.layers.front);
        var pauseTextObject = new SceneObject(pauseText);
        pauseTextObject.setPosition(0, -100);
        wade.addSceneObject(pauseTextObject);
        pauseTextObject.setVisible(false);

        pauseText.setShadow('#000000', 3, 4, 4);
        var pauseSprite = new Sprite('images/buttonPause.png', self.layers.front);
        var pauseButton = new SceneObject(pauseSprite);
        pauseButton.removeOnGameOver = true;
        pauseButton.paused = false;
        pauseButton.onMouseUp = function()
        {
            this.paused = !this.paused;
            if(this.paused)
            {
                // Create darker area
                var darkSprite = new Sprite(null, self.layers.front);
                darkSprite.setSize(wade.getScreenWidth(), wade.getScreenHeight());
                this.blackArea = new SceneObject(darkSprite);
                this.blackArea.onMouseDown = function()
                {
                    return true;
                };
                this.blackArea.onMouseUp = function()
                {
                    return true;
                };
                darkSprite.cache();
                darkSprite.setDrawFunction(wade.drawFunctions.solidFill_('rgba(0, 0, 0, 0.4)'));
                wade.addSceneObject(this.blackArea);

                // Create larger play button under paused text
                var largePauseSprite = new Sprite('images/buttonUnpause.png', self.layers.front);
                largePauseSprite.setSize(200,200);
                this.largeButton = new SceneObject(largePauseSprite);
                this.largeButton.setPosition(0, 50);
                this.largeButton.onMouseDown = function()
                {
                    return true;
                };

                this.largeButton.onMouseUp = function()
                {
                    wade.removeSceneObject(pauseButton.blackArea);
                    pauseTextObject.setVisible(false);
                    wade.resumeSimulation();
                    pauseSprite.setImageFile('images/buttonPause.png');
                    wade.removeSceneObject(this);
                    pauseButton.paused = false;
                };
                wade.addSceneObject(this.largeButton, true);

                pauseTextObject.setVisible(true);
                pauseSprite.setImageFile('images/buttonUnpause.png');
                wade.pauseSimulation();
            }
            else
            {
                this.largeButton && wade.removeSceneObject(this.largeButton);
                wade.removeSceneObject(this.blackArea);
                pauseTextObject.setVisible(false);
                wade.resumeSimulation();
                pauseSprite.setImageFile('images/buttonPause.png');
            }
        };
        pauseButton.setPosition(-75, wade.getScreenHeight()/2 - pauseSprite.getSize().y/2);
        wade.addSceneObject(pauseButton, true);
    };

    /**
     * Gets called by match 3 logic on game over condition
     */
    this.onGameOver = function()
    {
        this.gameOver = false;
        self.musicPlaying = false;
        wade.stopAudio(self.musicSource);

        // Create explosion sound
        if(!wade.app.soundMuted)
        {
            wade.playAudioIfAvailable('sounds/explosion1.ogg');
        }

        // Get previous best scores
        var scoresObj = wade.retrieveLocalObject("match3Scores");
        if(scoresObj)
        {
            self.scores = scoresObj;
        }
        self.scores.values.push(self.scoreObject.getBehavior().getValue());
        self.scores.values.sort(function(a, b){return b-a});
        self.scores.values.length = 3;
        wade.storeLocalObject("match3Scores", self.scores);

        // Remove buttons
        wade.removeSceneObjects(wade.getSceneObjects('removeOnGameOver', true));



        var timeOutSprite = new TextSprite('Time\'s Up!','72px ArtDept1', 'white', 'center', self.layers.front);
        timeOutSprite.setShadow('#000',3 ,4 ,4);
        timeOutSprite.cache();
        timeOutSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0.0, 1.0, 2.0, timeOutSprite.getDrawFunction(),function()
        {
            // You Scored message
            var youScoredSprite = new TextSprite('You scored a\ntotal of ' + self.scoreObject.getBehavior().getValue() +'!','42px ArtDept1', 'white', 'center', self.layers.front);
            youScoredSprite.setShadow('#000',1 ,2 ,2);
            youScoredSprite.cache();
            youScoredSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0.0, 1.0, 1.0, timeOutSprite.getDrawFunction(), function()
            {
                // Previous scores
                var scoreSprite = new TextSprite('Current Best:\n1. ' + self.scores.values[0] + '\n2. ' + self.scores.values[1] + '\n3. ' + self.scores.values[2],'42px ArtDept1', 'white', 'left', self.layers.front);
                scoreSprite.setShadow('#000',1 ,2 ,2);
                scoreSprite.cache();
                scoreSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0.0, 1.0, 1.0, scoreSprite.getDrawFunction(), function()
                {
                    // Create the back button, will go back to main menu
                    var backButtonSprite = new Sprite('images/buttonBack.png', self.layers.front);
                    backButtonSprite.setSize(200, 200);
                    var backButton = new SceneObject(backButtonSprite);
                    backButton.setPosition(wade.getScreenWidth()/2 - 120, wade.getScreenHeight()/2 - 245);
                    backButtonSprite.setDrawFunction(wade.drawFunctions.fadeOpacity_(0, 1, 0.5, backButtonSprite.getDrawFunction()));

                    backButton.onMouseUp = function() // Go to main menu
                    {
                        wade.clearScene();
                        self.game();
                    };
                    wade.addSceneObject(backButton, true);

                    // Create share buttons if social flag set
                    if(self.socialEnabled)
                    {
                        var google = new Sprite('images/google.png', self.layers.front);
                        google.setDrawFunction(wade.drawFunctions.fadeOpacity_(0, 1, 0.5, google.getDrawFunction()));
                        var googleObj = new SceneObject(google);
                        googleObj.onMouseUp = function()
                        {
                            open('https://plus.google.com/share?url=http%3A%2F%2Fccgames.cc%2Fstg', '_blank');
                        };
                        googleObj.setPosition(-225, wade.getScreenHeight()/2 - 225);
                        wade.addSceneObject(googleObj, true);

                        var facebook = new Sprite('images/facebook.png', self.layers.front);
                        facebook.setDrawFunction(wade.drawFunctions.fadeOpacity_(0, 1, 0.5, facebook.getDrawFunction()));
                        var facebookObj = new SceneObject(facebook);
                        facebookObj.onMouseUp = function()
                        {
                            open('https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fccgames.cc%2Fstg&t=Save%20The%20Galaxy%20', '_blank');
                        };
                        facebookObj.setPosition(-150, wade.getScreenHeight()/2 - 225);
                        wade.addSceneObject(facebookObj, true);

                        var twitter = new Sprite('images/twitter.png', self.layers.front);
                        twitter.setDrawFunction(wade.drawFunctions.fadeOpacity_(0, 1, 0.5, twitter.getDrawFunction()));
                        var twitterObj = new SceneObject(twitter);
                        twitterObj.onMouseUp = function()
                        {
                            open('https://twitter.com/share?url=http%3A%2F%2Fccgames.cc%2Fstg&via=ClockworkChilli&text=Check%20out%20this%20awesome%20top-down%20shooter%20game%20%23freegame%20%23html5', '_blank');
                        };
                        twitterObj.setPosition(-75, wade.getScreenHeight()/2 - 225);
                        wade.addSceneObject(twitterObj, true);
                    }
                }));
                var scoreTextObject = new SceneObject(scoreSprite);
                scoreTextObject.setPosition(-scoreSprite.getSize().x/2, 0);
                wade.addSceneObject(scoreTextObject);
            }));

            titleObject.addSprite(youScoredSprite, {x:0, y: 75});
        }));
        var titleObject = new SceneObject(timeOutSprite);
        titleObject.setPosition(0, -200);
        wade.addSceneObject(titleObject);
    };

};

//@ sourceURL=app.js