# Roadmap

## TODO

* [ ] factorize canvas draw
    * [x] draw holds
    * [ ] initialization (load image)
        * [x] have a generic store
        * [ ] apply the store to views
            * [ ] edit
            * [x] view
        * [ ] have a generic Canvas component (canvasDisplay)
            * [ ] edit
            * [x] view
* [ ] factorize mouse/touch events
    * [x] create nativeEvent → screenEvent
    * [x] screenEvent → stateInteraction
    * [ ] (should be done → to check) Manage zoom in "view" mode
* [ ] Build
    * [x] Add route information (name/description)
    * [ ] Actions
        * [ ] move: also move when "selection"
        * [ ] link: create a Link selection
        * [ ] link: starting on hold and restarting on hold
    * [ ] Shrink image size to allow sending editable route (set this as option?)
* [ ] Improve workflow
    * [ ] When moving from 'editor' to 'view', the settings should open
    * [ ] When settings are open, "enter" should validate the field (and validate the form if last field)

## Maybe to be done

* [ ] Add Youtube video player in background (www.youtube.com/iframe_api)
* [ ] In viewer
    * [ ] May allow to use it in competition (associate number with holds)
    * [ ] save the result
* [ ] Chronometer

## Known bugs

* [ ] icon file (used to load or save as file)
* [ ] videos dimensions
* [ ] canvas dimensions
    * [ ] It should not resize to the whole screen but preserve aspect ratio
* [ ] (minor) Menu on linked hold can be hover the selected hold
* [ ] improve scroll stability (do not compute position relative to canvas for scroll)
* [ ] iPhone/iPad
