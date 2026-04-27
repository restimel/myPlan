# Test scenario

### Key explanation

1. **Action to do**
    * [ ] *expected result*
    * [x] ← works as expected (during last test)
    * [ ] ← had issue
        * *Explanation of the issue*

## Create a route and export it (smallest basic usage)

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
    * [x] The button should be in active state until we select an area
    * [x] It should grey all around holds
    * [x] Keep the holds of correct color in color
3. click on the screen
    * [x] it should add a hold
    * [x] the zoom level should not change (magic color filter is reapplied without resetting zoom)
4. click on the screen again
    * [x] it should add a hold (incrementing number)
5. add several holds
    * [x] There should be as many hold as clicks
6. click on "trash"
    * [x] the last hold should be removed
    * [x] the zoom level should not change (magic color filter is reapplied without resetting zoom)
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
16. when zoomed-in, scroll the image
    * [ ] The image should follow your finger
17. With 2 fingers, zoom-in, then hold on a hold
    * [x] a menu should appear near the hold (not off-screen)
18. With 2 fingers, zoom-in and scroll, then hold on a hold
    * [x] a menu should appear near the hold, correctly positioned relative to the visible area
19. With 2 fingers, pinch zoom (keep fingers on screen a moment after zooming)
    * [ ] No hold insertion dialog should appear
    * [ ] Zoom level should remain at the adjusted value
20. Open the holds panel (hold icon) and move the size slider
    * [ ] All hold sizes should update at once
    * [ ] The slider position should reflect the current default hold size
21. Long press (~0.5s) on an empty area of the canvas (no hold under finger, without moving)
    * [ ] A dialog should appear asking for a hold number
    * [ ] Default value should be the next available number (last + 1)
    * [ ] Entering a number already in use (e.g. 3) and confirming should insert a new hold at that position, shifting existing ones (3→4, 4→5…)
    * [ ] Cancelling should add no hold
22. Zoom in, then try to zoom out beyond the initial fit-to-viewport level
    * [ ] It should not be possible to zoom-out below the initial fit level
23. Zoom in, observe the zoom-reset button (×N.N, bottom-left), then click it
    * [ ] The button should only appear when zoomed above fit level
    * [ ] Clicking it should return to fit-to-viewport and reset scroll to origin

## Image structure (warp)

1. Have a picture in "set hold" mode, open the structure panel (icon rectangle+arrows)
    * [ ] The panel should appear on the side
    * [ ] The warp button should NOT be in active state (no warp defined yet)
2. Click on the warp button (magnify+arrows)
    * [ ] The warp edition panel should replace the structure panel
    * [ ] Two horizontal lines should appear on the image, one in the upper zone, one in the lower zone
    * [ ] The lines should be positioned correctly on the image (not offset)
    * [ ] The delete button should NOT be visible (no saved warp yet)
3. Move the top boundary slider
    * [ ] The top line should move accordingly on the image
    * [ ] The slider value (%) should update
    * [ ] The slider cannot be set above the bottom boundary value
    * [ ] When holds change area, they should be still correctly positioned
4. Move the bottom boundary slider
    * [ ] The bottom line should move accordingly on the image
    * [ ] The slider value (%) should update
    * [ ] The slider cannot be set below the top boundary value
    * [ ] When holds change area, they should be still correctly positioned
5. Move the factor slider
    * [ ] The image should be stretched in real time between the two lines
    * [ ] Holds above the top boundary should not move
    * [ ] Holds inside the band should be repositioned proportionally
    * [ ] Holds below the bottom boundary should be shifted down
6. Zoom in and out while the warp edition panel is open
    * [ ] The two lines should stay correctly positioned on the image
    * [ ] The handle (pill) on each line should remain visible on screen
7. Pan (drag) the image while the warp edition panel is open
    * [ ] The two lines should follow the image correctly (no offset)
8. Click cancel (× on the panel)
    * [ ] The warp edition panel should close, back to the structure panel
    * [ ] The image should be unchanged (no warp applied)
    * [ ] The warp button should still NOT be in active state
9. Re-open warp edition and click validate
    * [ ] The panel should close
    * [ ] The warp button in the structure panel should now be in active state
    * [ ] The image remains stretched as configured
10. Re-open warp edition
    * [ ] Sliders should reflect the previously saved values
    * [ ] The delete button should now be visible
11. Click delete
    * [ ] The warp edition panel should close
    * [ ] The image should return to its original (non-stretched) state
    * [ ] The warp button should no longer be in active state
12. Apply a warp, then add holds
    * [ ] New holds should be placed at the correct position on the stretched image
    * [ ] Removing or moving holds should not reset the zoom level
13. Re-capture a new image
    * [ ] The previous warp should not be applied

## Re-use a route

## Chronometer
1. click on 'Chronometer'
    * [x] The chronometer page should be displayed
    * [x] 1 period setting should be displayed
2. Change the period name
    * [x] The period name in the preview should be changed
3. Change the duration
    * [x] The duration is changed in the preview
    * [x] If putting the value to 0, it should not trigger end effects
4. Change "Effect at the end"
    * [x] When "sounds" is un-ticked, "Intermediate beep" should be displayed differently (but its checked state should stay the same)
    * [x] If "sounds" and "Intermediate beep" are not ticked, when "Intermediate beep" is ticked, "sounds" should be ticked too.
5. Start timer (click on timer or on icon)
    * [x] timer should count down
    * [x] small timer should count up
    * [x] "play" icon should be changed to "pause" icon
6. Pause timer (click on timer or on icon)
    * [x] timers should stop
    * [x] "pause" icon should be changed to "play" icon
7. Start timer again
    * [x] timer should continue from previous value
    * [x] it should not lock when timer is enabled
    * [x] when there are less than 10s, digits should be in red (blink)
    * [x] If "intermediate beep" enabled, it should play beep at 1min, 10s (each second less than 10s)
9. When timeout
    * [x] If sound enabled, it should play sound
    * [x] If vibrate enabled, it should vibrate
    * Depending on the action selected, it should
        * [x] stop counting (background should be in red)
        * [x] continue counting (background should be in red)
        * [x] restart counting
        * [x] start the next period
10. Click on reset icon
    * [x] The timer should be re-initialized
    * [x] With multiple periods, the current period should NOT change (stays on current period)
    * [x] With multiple periods and "Return to period 1" enabled on current period, clicking reset should go back to period 1
11. Refresh the page
    * [x] All periods should stay the same as before
12. Add new period
    * [x] it should displayed a new period to edit bellow all other periods
    * [x] the new period should be expanded (active), previous periods should be collapsed showing only their name and duration
    * [x] If the number of periods is greater than the screen size, we should be able to scroll to see them all.
        * We cannot scroll
13. Click on a collapsed period summary
    * [x] it should become the active period and expand
    * [x] the previously active period should collapse to its summary line
14. Click on the summary of the currently active (expanded) period when other periods exist
    * [ ] The next period should become active (expand), the clicked period should collapse
    * [ ] If it is the last period, clicking its summary should have no effect
15. In dark mode, check the period summaries (collapsed periods)
    * [ ] Period name and duration text should be clearly readable on the dark background
16. Delete a period
    * [x] A confirm system should prevent wrong deletion (current implementation is we need to click again on the button)
    * [x] The given period should be removed
17. Click on "Clear all periods"
    * [x] It should reset all periods and display the default one
    * [x] The button should now be disabled
18. Click on fullscreen
    * [ ] The timer should be displayed in fullscreen.
    * [ ] All operations (play/stop/restart) should be available
    * [ ] We should be available to leave this mode

## PWA

1. When a new version is deployed, the update banner appears
    * [ ] The message should be fully readable (text wraps on narrow screens, not cut off)
    * [ ] Clicking "Update" should reload the app with the new version
    * [ ] Clicking "Later" should dismiss the banner
