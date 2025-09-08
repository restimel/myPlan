# Test scenario

1. **Action to do**
    * *expected result*

## Create a route and export it

1. click on 'Build plan'
    * The camera should start
2. click on screen
    * capture the current picture and switch to "set hold" mode
3. add some holds (click on screen)
    * holds should be visible
    * holds should have incrementing numbers
4. click on validate
    * switch to "view" mode
    * "top: X" should be displayed
    * holds should be displayed at the same place
5. Export image
    * image can be download to device and should be the same as in "view" mode
6. Navigate back to "Build plan" / or / click on "edit"
    * The previous image should be displayed
    * we should be in "set hold" mode

**Known bugs**:
    * -

## Create detailed route

1. click on 'Build plan' and have a picture
    * we should be in "set hold" mode
2. Open menu and use magic color on a hold
    * It should grey all around holds
    * Keep the hold of correct color in color
3. click on the screen
    * it should add a hold
4. click on the screen again
    * it should add a hold (incrementing number)
5. double click on the 1st hold
    * the hold should be double
    * the next holds should have incrementing their number
6. double click on the 1st hold
    * the hold should be single
    * the next holds should have decrementing their number
7. hold on a hold and move it
    * the hold should be moved
8. hold on a hold
    * a menu should appear

**Known bugs**:
    * -

## Re-use a route
