# Roadmap

## TODO

* [ ] Build
    * [ ] Actions
        * [ ] move: also move when "selection"
        * [ ] link: create a Link selection (without drag&drop)
        * [ ] link: starting on hold and restarting on hold
    * [ ] Shrink image size to allow sending editable route (set this as option?)
    * [x] Create image menu
        * [x] Manage (all) hold size ? (not really related to image...)
    * [x] add a button to zoom to view port
* [ ] Add a guide page to explain how to use the application
* [ ] Chronometer
    * [ ] create settings template (to re-use previous configuration)
        * [ ] be able to share them to another device
    * [ ] in fullscreen
        * [ ] allow to display it horizontally (device orientation detection?)

## Improvements

* [x] On hold menu add the hold number (summary)
* [x] z-index (in this list top item should be over bottom items):
    * hold menu (which is open by staying on a hold)
    * sliders & panel menus
    * extended menu
* [x] In warp edition, it is possible to add new holds (either simple touch or long touch) but not to move or edit hold

## Maybe to be done

* [ ] Create a new mode: competition
    * [ ] May allow to use it in competition (associate number with holds)
        * [ ] create shortcut between holds
    * [ ] save the result
* [ ] Add Youtube video player in background (www.youtube.com/iframe_api) -- can it be used freely?

## Known bugs

* [ ] (minor) improve icon file
    * [ ] used to load an image (from device). It is not easy to understand that this is to load a picture from the device
* [ ] videos dimensions
* [ ] canvas dimensions
    * [ ] It should not resize to the whole screen but preserve aspect ratio
* [x] improve scroll stability (do not compute position relative to canvas for scroll)
* [ ] iPhone/iPad -- seems that application to not work with them
* [ ] editor mode
    * [ ] during capture, video size may hide menu (needs more details, maybe it appears on mobile?)
    * [x] When closing extended menu, sometime it doesn't close. It seems to happen when mouse is clicked for a long time (the button move down, and when mouse is released the event mouseup is no more on the element). → Why the element moves when mousedown? (it should move only when menu is closed)
