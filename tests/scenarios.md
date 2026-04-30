# Test scenario

### Key explanation

1. **Action to do**
    * [ ] *expected result*
    * [x] ← works as expected (during last test)
    * [~] ← Not tested yet (or fix not confirmed)
    * [ ] ← had issue
        * *Explanation of the issue*

Last test done on version: 0.19.1-test.5

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
// add step about manipulating contrast and light
2. Open menu and use magic color on a hold
    * [x] The button should be in active state until we select an area
    * [x] It should grey all around holds
    * [x] Keep the holds of correct color in color
    * [x] Color around holds number should be re-enabled.
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
    * [ ] It should zoom-in and out smoothly
        * When reaching the max zoom (scale = 10), the image scroll quickly to the bottom right. It seems that scale is correctly stopped but not the offset
16. when zoomed-in, scroll the image
    * [x] The image should follow your finger
17. With 2 fingers, zoom-in, then hold on a hold
    * [x] a menu should appear near the hold (not off-screen)
18. scroll a little bit to move the hold where the menu was, then hold on the hold
    * [x] the menu should appear near the hold, correctly positioned relative to the visible area (different position from previous step)
19. With 2 fingers, pinch zoom (keep fingers on screen a moment after zooming)
    * [x] No hold insertion dialog should appear
    * [x] Zoom level should remain at the adjusted value
20. Open the holds panel (hold icon) and move the size slider
    * [x] All hold sizes should update at once
    * [x] The slider position should reflect the current default hold size
21. Long press (~0.5s) on an empty area of the canvas (no hold under finger, without moving)
    * [x] A dialog should appear asking for a hold number
    * [x] Default value should be the next available number (last + 1)
    * [x] Entering a number already in use (e.g. 3) and confirming should insert a new hold at that position, shifting existing ones (3→4, 4→5…). It should work when using a number used for double hold.
    * [x] Cancelling should add no hold
22. Zoom in, then try to zoom out beyond the initial fit-to-viewport level
    * [x] It should not be possible to zoom-out below the initial fit level
23. Zoom in, observe the zoom-reset button (×N.N, bottom-left), then click it
    * [x] The button should only appear when zoomed above fit level
    * [x] Clicking it should return to fit-to-viewport and reset scroll to origin

## Image structure (warp)

1. Have a picture in "set hold" mode, open the structure panel (icon rectangle+arrows)
    * [x] The panel should appear on the side
    * [x] The warp button should NOT be in active state (no warp defined yet)
2. Click on the warp button (magnify+arrows)
    * [x] The warp edition panel should replace the structure panel
    * [x] Two horizontal lines should appear on the image, one in the upper zone, one in the lower zone
    * [x] The lines should be positioned correctly on the image (not offset)
    * [x] The delete button should NOT be visible (no saved warp yet)
3. Move the top boundary slider
    * [x] The top line should move accordingly on the image
    * [x] The slider value (%) should update
    * [x] The slider cannot be set above the bottom boundary value
    * [x] When holds change area, they should be still correctly positioned
4. Move the bottom boundary slider
    * [x] The bottom line should move accordingly on the image
    * [x] The slider value (%) should update
    * [x] The slider cannot be set below the top boundary value
    * [x] When holds change area, they should be still correctly positioned
5. Move the factor slider
    * [x] The image should be stretched in real time between the two lines
    * [x] Holds above the top boundary should not move
    * [x] Holds inside the band should be repositioned proportionally
    * [x] Holds below the bottom boundary should be shifted down
6. Zoom in and out while the warp edition panel is open
    * [x] The two lines should stay correctly positioned on the image
    * [x] The handle (pill) on each line should remain visible on screen
    * [ ] Moving boundary should update value accordingly
        * image scale is reset (it also happens when factor slider is changed)
7. Pan (drag) the image while the warp edition panel is open
    * [x] The two lines should follow the image correctly (no offset)
8. Click cancel (× on the panel)
    * [x] The warp edition panel should close, back to the structure panel
    * [x] The image should be unchanged (no warp applied)
    * [x] The warp button should still NOT be in active state
9. Re-open warp edition and click validate
    * [x] The panel should close
    * [x] The warp button in the structure panel should now be in active state
    * [x] The image remains stretched as configured
10. Re-open warp edition
    * [x] Sliders should reflect the previously saved values
    * [x] The delete button should now be visible
11. Click delete
    * [x] The warp edition panel should close
    * [x] The image should return to its original (non-stretched) state
    * [x] The warp button should no longer be in active state
12. Apply a warp, then add holds
    * [x] New holds should be placed at the correct position on the stretched image
    * [x] Removing or moving holds should not reset the zoom level
13. Re-capture a new image
    * [x] The previous warp should not be applied

## Multi-photo route (add photo above / below)

1. Have a picture with several holds placed, open the structure panel
    * [x] "Add photo above" and "Add photo below" buttons should be visible
2. Click "Add photo below", capture a new image, validate the stitch
    * [x] The combined image should be displayed (original on top, new on bottom)
    * [x] All existing holds should still be at the correct positions on the original area
    * [x] Existing hold sizes should appear visually proportional to the combined image (scaled up slightly)
    * [x] New holds added in the original area should match the size of existing holds
3. Click "Add photo above", capture a new image, validate the stitch
    * [x] The combined image should be displayed (new on top, original on bottom)
    * [x] All existing holds should be shifted down to their correct position in the combined image
    * [x] Existing hold sizes should appear visually proportional to the combined image
4. In the stitch view, drag the overlap position handle up or down before validating
    * [x] After validating, holds should still land at the correct position in the combined image (offset accounts for the adjusted overlap)
5. Export the combined route
    * [x] Holds should be at the correct positions in the exported image

## Re-use a route
// todo

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
    * [ ] If vibrate enabled, it should vibrate
        * no vibration are emitted (even when trying the "test" button)
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
    * [x] The next period should become active (expand), the clicked period should collapse
    * [x] If it is the last period, clicking its summary should have no effect
15. Navigate in dark mode
    * [x] Period name and duration text should be clearly readable on the dark background
    * [x] Label and fields should be clearly readable on the dark background
16. Delete a period
    * [x] A confirm system should prevent wrong deletion (current implementation is we need to click again on the button)
    * [x] The given period should be removed
17. Click on "Clear all periods"
    * [ ] A confirm system should prevent wrong deletion
        * periods are deleted straight away
    * [x] It should reset all periods and display the default one
    * [x] The button should now be disabled
18. Click on fullscreen
    * [x] The timer should be displayed in fullscreen.
    * [x] All operations (play/stop/restart) should be available
    * [x] A clock should be visible to provide the current time
    * [ ] We should be available to leave this mode
        * [ ] I don't see any button to leave fullscreen

## PWA

1. When a new version is deployed, the update banner appears
    * [x] The message should be fully readable (text wraps on narrow screens, not cut off)
    * [~] The old and new version should be displayed
    * [x] Clicking "Update" should reload the app with the new version
    * [~] Clicking "Later" should dismiss the banner
