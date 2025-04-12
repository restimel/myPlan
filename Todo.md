# Roadmap

## TODO

* [ ] create a logo icon
* [ ] factorize canvas draw
    * [x] draw holds
    * [ ] initialization (load image)
* [ ] factorize mouse/touch events
    * [x] create nativeEvent → screenEvent
    * [x] screenEvent → stateInteraction
    * [ ] Manage zoom in "view" mode
* [ ] Build
    * [ ] Add route information (name/description)
    * [ ] Actions
        * [ ] move: also move when "selection"
        * [ ] link: create a Link selection
        * [ ] link: starting on hold and restarting on hold
    * [ ] Shrink image size to allow sending editable route (set this as option?)

## Maybe to be done

* [ ] Add Youtube video player in background (www.youtube.com/iframe_api)
* [ ] In viewer
    * [ ] May allow to use it in competition (associate number with holds)
    * [ ] save the result

## Known bugs

* [x] Header too long (in French)
* [ ] videos dimensions
* [ ] canvas dimensions
    * [ ] It should not resize to the whole screen but preserve aspect ratio
* [x] Menu on bottom holds is displayed outside the canvas
* [ ] (minor) Menu on linked hold can be hover the selected hold
