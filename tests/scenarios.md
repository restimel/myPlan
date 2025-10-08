# Test scenario

### Key explanation

1. **Action to do**
    * [ ] *expected result*
    * [x] ← works as expected (during last test)
    * [ ] ← had issue
        * *Explanation of the issue*

## Create a route and export it

1. click on 'Build plan'
    * [x] The camera should start
2. click on screen
    * [x] capture the current picture and switch to "set hold" mode
3. add some holds (click on screen)
    * [x] holds should be visible
    * [x] holds should have incrementing numbers
4. click on validate
    * [x] switch to "view" mode
    * [x] should propose to fill settings
5. Enter a title and confirm
    * [x] The given title should be displayed
    * [x] "top: X" should be displayed
    * [x] holds should be displayed at the same place (same size)
5. Export image
    * [x] image can be download to device and should be the same as in "view" mode
    * [x] It should propose a file name which includes the title
6. Navigate back to "Build plan" / or / click on "edit"
    * [x] we should be in "set hold" mode
    * [x] The previous image should be displayed
    * [x] holds should be at the same place

## Create detailed route

1. click on 'Build plan' and have a picture
    * [x] we should be in "set hold" mode
2. Open menu and use magic color on a hold
    * [x] It should grey all around holds
    * [x] Keep the holds of correct color in color
3. click on the screen
    * [x] it should add a hold
4. click on the screen again
    * [x] it should add a hold (incrementing number)
5. add several holds
    * [x] There should be as many hold as clicks
6. click on "trash"
    * [x] the last hold should be removed
7. double click on the 1st hold
    * [x] the hold should be double
    * [x] the next holds should have incrementing their number
8. double click on the 1st hold
    * [x] the hold should be single
    * [x] the next holds should have decrementing their number
9. hold on a hold and move it
    * [x] the hold should be moved
10. hold on a hold
    * [x] a menu should appear
11. click on "Move up"
    * [x] The number should have been incremented
    * [x] Number of hold with the number just after should have decreased (should also work fo double hold)
12. click on "Move down"
    * [x] The number should have been decremented
    * [x] Number of hold with the number just before should have increased (should also work fo double hold)
13. click outside menu
    * [x] Menu should close
    * [x] No new hold should have been created
14. maintain finger on a hold and when menu appears move to another hold
    * [x] it should link the 2 holds
    * [x] numbers should be updated accordingly
15. With 2 fingers, zoom-in and zoom-out
    * [x] It should zoom-in and out smoothly
16. when zoomed-in, scroll the image
    * [ ] The image should follow your finger
        * The image is moved but does not follow exactly the finger

## Re-use a route

## Chronometer
1. click on 'Chronometer'
    * [x] The chronometer page should be displayed
    * [x] 1 period setting should be displayed
2. Change the period name
    * [x] The period name in the preview should be changed
3. Change the duration
    * [x] The duration is changed in the preview
4. Start timer (click on timer or on icon)
    * [x] timer should count down
    * [x] small timer should count up
    * [x] "play" icon should be changed to "pause" icon
5. Pause timer (click on timer or on icon)
    * [x] timers should stop
    * [x] "pause" icon should be changed to "play" icon
6. Start timer again
    * [x] timer should continue from previous value
    * [x] when there are less than 10s, digits should be in red (blink)
7. When timeout
    * [ ] If sound enabled, it should play sound
    * [x] If vibrate enabled, it should vibrate
    * Depending on the action selected, it should
        * [x] stop counting (background should be in red)
        * [x] continue counting (background should be in red)
        * [x] restart counting
        * [x] start the next period
8. Click on reset icon
    * [x] The timer should be re-initialized
