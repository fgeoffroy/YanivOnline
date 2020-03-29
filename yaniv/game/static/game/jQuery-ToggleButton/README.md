BlueToggleButton
================

JQuery toggle button plugin. Turn simple checkboxes in to better looking toggle buttons.


Html:
```HTML
<input id="toggle-button" type="checkbox" />
```

Javascript:
```JS  
$("#toggle-button").toggleButton();
```

Javascript with default options shown"
```JS  
$("#toggle-button").toggleButton({
  text : "Toggle",
  toggleOnColor : "green",
  onTitle : "On",
  offTitle : "Off",
  onImg: "toggleON.png",
  offImg: "toggleOFF.png",   
});
```
