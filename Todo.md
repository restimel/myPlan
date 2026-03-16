# Roadmap

## TODO

* [ ] factorize canvas draw
    * [ ] initialization (load image)
        * [x] have a generic Canvas component (canvasDisplay)
            * [x] edit
            * [x] view
* [ ] Build
    * [ ] capturing image
        * [ ] capture several images to create a larger image (for long wall)
    * [ ] Actions
        * [ ] move: also move when "selection"
        * [ ] link: create a Link selection
        * [ ] link: starting on hold and restarting on hold
        * [ ] improve image quality: add a tool to change contrast
        * [ ] improve image quality: add a tool to change light (dark/light)
    * [ ] Shrink image size to allow sending editable route (set this as option?)
    * [ ] Create image menu
        * [ ] Contrast image
        * [ ] Magic color to adjust around the color
        * [ ] Manage (all) hold size ?
* [ ] Add a guide page to explain how to use the application

## Maybe to be done

* [ ] Add Youtube video player in background (www.youtube.com/iframe_api)
* [ ] In viewer
    * [ ] May allow to use it in competition (associate number with holds)
        * [ ] create shortcut between holds
    * [ ] save the result
* [ ] Chronometer
    * [x] allow to change background color for a period
    * [ ] create settings template

## Known bugs

* [ ] (minor) improve icon file (used to load)
* [ ] videos dimensions
* [ ] canvas dimensions
    * [ ] It should not resize to the whole screen but preserve aspect ratio
* [ ] (minor) Menu on linked hold can be hover the selected hold
* [ ] improve scroll stability (do not compute position relative to canvas for scroll)
* [ ] iPhone/iPad
* [ ] editor mode
    * [ ] during capture, video size may hide menu
    * [x] the magic marker is over menu
    * [x] when editing from view, the holds restart from 1
    * [x] When leaving while modification are done (after image is captured and at least 1 hold added), leaving the page (refresh/change route) will result in losing the work done → a prompt should warn user before leaving
