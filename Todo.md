# Roadmap

## TODO

* [ ] factorize canvas draw
    * [ ] initialization (load image)
        * [ ] have a generic Canvas component (canvasDisplay)
            * [ ] edit
            * [x] view
* [ ] Build
    * [ ] Actions
        * [ ] move: also move when "selection"
        * [ ] link: create a Link selection
        * [ ] link: starting on hold and restarting on hold
        * [ ] magic color: set in color under (and around) holds
    * [ ] Shrink image size to allow sending editable route (set this as option?)
* [ ] Add a guide page to explain how to use the application

## Maybe to be done

* [ ] Add Youtube video player in background (www.youtube.com/iframe_api)
* [ ] In viewer
    * [ ] May allow to use it in competition (associate number with holds)
        * [ ] create shortcut between holds
    * [ ] save the result
* [ ] Chronometer
    * [ ] allow to change background color for a period
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
    * [ ] when editing from view, the holds restart from 1
* [ ] view mode
    * [ ] cannot scroll when starting over a hold
