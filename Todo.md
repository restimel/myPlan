# Roadmap

## TODO

* [x] factorize canvas draw
    * [x] initialization (load image)
        * [x] have a generic Canvas component (canvasDisplay)
            * [x] edit
            * [x] view
* [ ] Build
    * [x] capturing image
        * [x] capture several images to create a larger image (for long wall)
    * [ ] Actions
        * [ ] move: also move when "selection"
        * [ ] link: create a Link selection (without drag&drop)
        * [ ] link: starting on hold and restarting on hold
    * [ ] Shrink image size to allow sending editable route (set this as option?)
    * [ ] Create image menu
        * [x] improve image quality: add a tool to change contrast
        * [x] improve image quality: add a tool to change light (dark/light)
        * [x] Magic color to adjust around the color
        * [ ] Manage (all) hold size ? (not really related to image...)
    * [ ] add a button to zoom to view port
* [ ] Add a guide page to explain how to use the application
* [ ] Chronometer
    * [x] allow to change background color for a period
    * [ ] create settings template (to re-use previous configuration)
        * [ ] be able to share them to another device

## Maybe to be done

* [ ] Create a new mode: competition
    * [ ] May allow to use it in competition (associate number with holds)
        * [ ] create shortcut between holds
    * [ ] save the result
* [ ] Add Youtube video player in background (www.youtube.com/iframe_api) -- can it be used freely?

## Known bugs

* [ ] (minor) improve icon file
    * [ ] used to load an image (from device)
    * [x] used to add a picture at bottom
    * [x] used to add a picture at top
* [ ] videos dimensions
* [ ] canvas dimensions
    * [ ] It should not resize to the whole screen but preserve aspect ratio
* [x] (minor) Menu on linked hold can be hover the selected hold
* [x] Menu height seems to be wrong because sometime it displays over holds
    → how to reproduce: small screen (360 × 740),  a hold at center (horizontally), 2/3 vertically, create another hold bellow and link them. Open the menu: it displays over the first hold (the bottom of the menu is at bottom of 1st hold) then when the 'linked' header disappears the bottom menu is at top of the 1st hold (there are enough space on top of them menu to be moved toward top).
* [ ] improve scroll stability (do not compute position relative to canvas for scroll)
* [ ] iPhone/iPad -- seems that application to not work with them
* [ ] editor mode
    * [ ] during capture, video size may hide menu (needs more details, maybe it appears on mobile?)
    * [x] the magic marker is over menu
    * [x] when editing from view, the holds restart from 1
    * [x] When leaving while modification are done (after image is captured and at least 1 hold added), leaving the page (refresh/change route) will result in losing the work done → a prompt should warn user before leaving
