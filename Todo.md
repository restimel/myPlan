# Roadmap

## TODO

* [ ] create a logo icon
* [ ] factorize canvas draw
    * [x] draw holds
    * [ ] initialization (load image)
* [ ] factorize mouse/touch events
    * [x] create nativeEvent → screenEvent
    * [ ] screenEvent → stateInteraction
* [x] add actions in viewer
* [ ] In viewer
    * [x] Display TOP
    * [x] May edit the route
* [x] Add link to github contribution/bugs
* [x] keep work in memory (when changing page)
* [ ] save as file (export image)
    * [x] the route with holds
    * [x] the final route with holds and details (in viewer)
* [ ] Add route information (name/description)
* [ ] Add Youtube video capture
* [ ] Shrink image size to allow sending editable route

## To improve

* [ ] Actions
    * [ ] move: also move when "selection"
    * [ ] link: create a Link selection
    * [ ] link: starting on hold and restarting on hold

## Maybe to be done

* [ ] Rename project (MyRoute ?) -- but it may be issue about first communications
* [ ] In viewer
    * [ ] May allow to use it in competition (associate number with holds)
    * [ ] save the result

## Known bugs

* [ ] Header too long (in French)
* [ ] videos dimensions
* [ ] canvas dimensions
    * [ ] It should not resize to the whole screen but preserve aspect ratio
* [ ] Menu on bottom holds is displayed outside the canvas
* [ ] Menu on linked hold can be hover the selected hold
